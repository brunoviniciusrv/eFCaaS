import { NewsItem } from '../types';

function toScore(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export function formatAiScore(value?: number): string {
  return value != null ? `${value}%` : '—';
}

export function formatClassificationLabel(value?: string | null): string {
  if (!value?.trim()) return '—';
  return value.trim();
}

/** Normaliza confiança da classificação para escala 0–100 (API pode enviar 0–1 ou 0–100). */
export function toConfidenceScore(value?: number | null): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.round(Math.max(0, Math.min(100, n)));
}

export type ClassificationTone = 'positive' | 'negative' | 'neutral';

export function getClassificationTone(value?: string | null): ClassificationTone {
  const v = value?.trim().toLowerCase() ?? '';
  if (!v || v === '—') return 'neutral';
  if (v === 'sim' || v === 'yes' || v === 'true') return 'negative';
  if (v === 'não' || v === 'nao' || v === 'no' || v === 'false') return 'positive';
  if (v.includes('não classificado') || v.includes('nao classificado') || v.includes('not classified')) {
    return 'positive';
  }
  if (v.includes('ódio') || v.includes('odio') || v.includes('antidemocr') || v.includes('discurso')) {
    return 'negative';
  }
  return 'neutral';
}

export function isSameClassification(a?: string | null, b?: string | null): boolean {
  const x = a?.trim().toLowerCase() ?? '';
  const y = b?.trim().toLowerCase() ?? '';
  return Boolean(x && y && x === y);
}

export function mergeAiAnalysisUpdate(current: NewsItem, fresh: NewsItem): NewsItem {
  return {
    ...current,
    aiScores: fresh.aiScores ? { ...fresh.aiScores } : current.aiScores,
    aiEvaluation: fresh.aiEvaluation
      ? {
          ...fresh.aiEvaluation,
          characteristics: [...fresh.aiEvaluation.characteristics],
          topics: [...fresh.aiEvaluation.topics],
          entities: fresh.aiEvaluation.entities.map((e) => ({ ...e })),
          dates: [...fresh.aiEvaluation.dates],
        }
      : current.aiEvaluation,
    iaStatus: fresh.iaStatus ?? current.iaStatus,
    isAIProcessing: fresh.isAIProcessing ?? current.isAIProcessing,
  };
}

/** Mescla detalhe do conteúdo preservando edições locais e priorizando métricas IA da API. */
export function mergeConteudoDetail(prev: NewsItem, fresh: NewsItem): NewsItem {
  const withAi = mergeAiAnalysisUpdate(prev, fresh);
  return {
    ...withAi,
    ...fresh,
    id: prev.id,
    evidence: fresh.evidence,
    reportStructure: fresh.reportStructure ?? prev.reportStructure,
    report: fresh.report ?? prev.report,
    aiScores: fresh.aiScores ? { ...fresh.aiScores } : withAi.aiScores,
    aiEvaluation: fresh.aiEvaluation
      ? {
          ...fresh.aiEvaluation,
          characteristics: [...fresh.aiEvaluation.characteristics],
          topics: [...fresh.aiEvaluation.topics],
          entities: fresh.aiEvaluation.entities.map((e) => ({ ...e })),
          dates: [...fresh.aiEvaluation.dates],
        }
      : withAi.aiEvaluation,
  };
}

export type DesinfoScoreKey = 'inveracidade' | 'falsidade' | 'distorcaoMidia';

export function getDesinfoScore(
  scores: NewsItem['aiScores'] | undefined,
  key: DesinfoScoreKey
): number | undefined {
  if (!scores) return undefined;
  const values: Record<DesinfoScoreKey, number | undefined> = {
    inveracidade: scores.inveracidade ?? scores.gravity,
    falsidade: scores.falsidade ?? scores.urgency ?? scores.distorcao,
    distorcaoMidia: scores.distorcaoMidia ?? scores.trend ?? scores.foraDeContexto,
  };
  const value = values[key];
  return value != null ? value : undefined;
}

export function hasAiMetrics(
  scores?: NewsItem['aiScores'],
  evaluation?: NewsItem['aiEvaluation']
): boolean {
  if (scores) {
    const hasScore = [
      scores.inveracidade,
      scores.falsidade,
      scores.distorcaoMidia,
      scores.riscoIlicitude,
      scores.gravity,
      scores.urgency,
      scores.trend,
    ].some((value) => value != null);
    if (hasScore) return true;
  }
  if (evaluation) {
    return Boolean(
      evaluation.classificacaoOdio?.trim()
      || evaluation.classificacaoAntidemo?.trim()
      || evaluation.confiancaClassificacao != null
      || evaluation.certezaAlegacao != null
      || hasAiEvaluation(evaluation)
    );
  }
  return false;
}

export function hasAiEvaluation(evaluation?: NewsItem['aiEvaluation']): boolean {
  if (!evaluation) return false;
  return Boolean(
    evaluation.explanation?.trim()
    || evaluation.characteristics.length > 0
    || evaluation.entities.length > 0
    || evaluation.location?.trim()
    || evaluation.dates.length > 0
    || evaluation.topics.length > 0
    || evaluation.pseudoLabel?.trim()
    || evaluation.categoriaFinal?.trim()
    || evaluation.classificacaoOdio?.trim()
    || evaluation.classificacaoAntidemo?.trim()
    || evaluation.certezaAlegacao != null
  );
}

export function parseMisinformationFeatures(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  if (raw.includes(';')) {
    return raw.split(';').map((s) => s.trim()).filter(Boolean);
  }
  if (raw.includes('\n')) {
    return raw.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return [raw.trim()];
}

/** Normaliza certeza (0–100 ou 0–1) para escala 0–1. */
export function normalizeCertaintyScore(score?: number | null): number | null {
  if (score == null || !Number.isFinite(score)) return null;
  return score > 1 ? score / 100 : score;
}

/** Exibe certeza no formato da plataforma Guaia (ex.: "0.46"). */
export function formatCertaintyScore(score?: number | null): string {
  const normalized = normalizeCertaintyScore(score);
  if (normalized == null) return '—';
  return normalized.toFixed(2);
}

export function parseAttributeList(raw?: string | null): string[] {
  if (!raw?.trim()) return [];

  let parts: string[];
  if (raw.includes('\n')) {
    parts = raw.split('\n');
  } else if (raw.includes(';')) {
    parts = raw.split(';');
  } else if (/\d+\.\s/.test(raw) && raw.split(/\s+(?=\d+\.\s)/).length > 1) {
    parts = raw.split(/\s+(?=\d+\.\s)/);
  } else if (raw.includes(',')) {
    parts = raw.split(',');
  } else {
    parts = [raw];
  }

  return parts
    .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean);
}

export function getModelEvaluationStatus(evaluation?: NewsItem['aiEvaluation']): string {
  if (!evaluation) return 'Análise do modelo em processamento.';

  const certainty = normalizeCertaintyScore(evaluation.certezaAlegacao);
  const pseudo = evaluation.pseudoLabel?.toLowerCase() ?? '';
  const risco = evaluation.avaliacaoRisco?.toLowerCase() ?? '';

  if (pseudo.includes('fake') || pseudo.includes('misinformation') || pseudo.includes('desinform')) {
    return 'Atenção: texto com indícios de ser fake ou desinformação.';
  }
  if (pseudo.includes('reliable') || pseudo.includes('verdade') || pseudo.includes('factual')) {
    return 'Atenção: texto com baixa chance de ser fake ou desinformação.';
  }

  if (certainty != null) {
    if (certainty >= 0.7) {
      return 'Atenção: texto com baixa chance de ser fake ou desinformação.';
    }
    if (certainty < 0.4) {
      return 'Atenção: texto com indícios elevados de ser fake ou desinformação.';
    }
    return 'Atenção: texto com chance moderada de ser fake ou desinformação.';
  }

  if (risco === 'crítico' || risco === 'alto') {
    return 'Atenção: texto com indícios elevados de ser fake ou desinformação.';
  }
  if (risco === 'baixo') {
    return 'Atenção: texto com baixa chance de ser fake ou desinformação.';
  }

  return 'Atenção: análise preliminar do modelo de IA concluída.';
}

export function hasModelEvaluationData(evaluation?: NewsItem['aiEvaluation']): boolean {
  return hasAiEvaluation(evaluation);
}
