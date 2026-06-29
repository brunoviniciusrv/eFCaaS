import { syncQuestionAnswers } from '../services/apiService';
import {
  AgencyConfig,
  LabelConfig,
  NewsItem,
  UserProfile,
} from '../types';
import { isAiModuleEnabled } from '../config/aiModules';
import { getDesinfoScore, hasAiEvaluation, hasAiMetrics } from './aiAnalysis';
import { normalizeResourceUrl } from './apiBaseUrl';
import { markdownLiteToHtml } from './markdownLite';
import { htmlToPlainText, parecerToEditorHtml, getContrastTextColor, normalizeReportForEditor } from './parecerHtml';

export interface ParecerQuestionItem {
  question: string;
  answer?: string;
}

export interface ParecerAiSection {
  inveracidade?: number;
  falsidade?: number;
  distorcaoMidia?: number;
  riscoIlicitude?: number;
  avaliacaoRisco?: string;
  explanation?: string;
  explanationHtml?: string;
  classificacaoOdio?: string;
  classificacaoAntidemo?: string;
}

export interface ParecerContentMedia {
  url: string;
  type: string;
  title?: string;
}

export interface ParecerReportData {
  agencyName: string;
  logoUrl: string;
  referenceNumber?: number;
  generatedAt: string;

  processOpenedAt: string;
  verifiers: string;
  contentPublishedAt: string;
  investigatedContent: string;
  contentMedia: ParecerContentMedia[];
  disinfoAuthor: string;
  questions: ParecerQuestionItem[];
  aiSection: ParecerAiSection | null;

  publicationLabel: string;
  publicationLabelColor: string;
  publicationLabelTextColor: string;
  title: string;
  olho?: string;
  lide: string;
  bodyHtml: string;

  checkerName: string;
  completedAt?: string;
}

function formatDatePt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTimePt(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function findLabel(labels: LabelConfig[], name?: string): LabelConfig | undefined {
  if (!name) return undefined;
  return labels.find((l) => l.name === name);
}

function buildInvestigatedContent(news: NewsItem): string {
  const parts: string[] = [];
  const alegacao = news.alegacao?.trim() || news.content?.trim();
  if (alegacao) parts.push(alegacao);
  if (news.descricao?.trim()) parts.push(news.descricao.trim());
  return parts.join('\n\n') || '—';
}

function buildContentMedia(news: NewsItem): ParecerContentMedia[] {
  return (news.media ?? []).map((item) => ({
    url: normalizeResourceUrl(item.url),
    type: item.type,
    title: item.title,
  }));
}

function buildDisinfoAuthor(news: NewsItem): string {
  const rs = news.reportStructure;
  const parts: string[] = [];

  if (rs?.disinfoAuthorUnverifiable) {
    parts.push('Autor inverificável.');
  } else if (rs?.disinfoAuthorName?.trim()) {
    parts.push(rs.disinfoAuthorName.trim());
  } else {
    parts.push('Não informado.');
  }

  parts.push('');
  parts.push('Tentativa de contato com o autor da alegação:');

  if (rs?.disinfoAuthorUnverifiable) {
    parts.push('Não aplicável — autor inverificável.');
  } else {
    const contact = rs?.contactWithAuthor;
    if (contact?.hadContact === true) {
      parts.push('Contato realizado.');
      if (contact.response?.trim()) {
        parts.push(`Resposta: ${contact.response.trim()}`);
      }
    } else if (contact?.hadContact === false) {
      parts.push('Contato não realizado.');
      if (contact.justification?.trim()) {
        parts.push(`Justificativa: ${contact.justification.trim()}`);
      }
    } else {
      parts.push('Não informado.');
    }
  }

  return parts.join('\n');
}

function buildQuestions(news: NewsItem): ParecerQuestionItem[] {
  const rs = news.reportStructure;
  const questions = rs?.questions ?? [];
  const answers = syncQuestionAnswers(questions, rs?.questionAnswers);

  return questions
    .map((question, index) => ({
      question: question.trim(),
      answer: (answers[index] ?? '').trim(),
    }))
    .filter((item) => item.question)
    .map((item, index) => ({
      question: `${index + 1}. ${item.question}`,
      answer: item.answer || undefined,
    }));
}

function buildAiSection(news: NewsItem, agencyConfig: AgencyConfig): ParecerAiSection | null {
  const scores = news.aiScores;
  const evaluation = news.aiEvaluation;
  if (!hasAiMetrics(scores, evaluation) && !hasAiEvaluation(evaluation)) return null;

  const showMisinfoAxis = isAiModuleEnabled(agencyConfig, 'enableTrendAnalyzer');
  const showIllicitAxis = isAiModuleEnabled(agencyConfig, 'enableMisinfoRisk');

  if (!showMisinfoAxis && !showIllicitAxis) return null;

  const section: ParecerAiSection = {};

  if (showMisinfoAxis) {
    const inveracidade = getDesinfoScore(scores, 'inveracidade');
    if (inveracidade != null) section.inveracidade = inveracidade;
    if (scores?.falsidade != null) section.falsidade = scores.falsidade;
    const distorcao = scores?.distorcaoMidia ?? scores?.distorcao;
    if (distorcao != null) section.distorcaoMidia = distorcao;
    const avaliacao = evaluation?.avaliacaoRisco ?? evaluation?.warningLevel;
    if (avaliacao?.trim()) section.avaliacaoRisco = avaliacao.trim();
    const explanation = evaluation?.explanation?.trim();
    if (explanation) {
      section.explanation = explanation;
      section.explanationHtml = markdownLiteToHtml(explanation);
    }
  }

  if (showIllicitAxis) {
    if (scores?.riscoIlicitude != null) section.riscoIlicitude = scores.riscoIlicitude;
    if (evaluation?.classificacaoOdio?.trim()) section.classificacaoOdio = evaluation.classificacaoOdio.trim();
    if (evaluation?.classificacaoAntidemo?.trim()) section.classificacaoAntidemo = evaluation.classificacaoAntidemo.trim();
  }

  const hasContent = Object.values(section).some((value) => value != null && value !== '');
  return hasContent ? section : null;
}

export function canDownloadParecerPdf(news: NewsItem | undefined): boolean {
  if (!news) return false;
  if (!['final_review', 'completed', 'to_rectify'].includes(news.status)) return false;
  return Boolean(news.reportStructure?.label?.trim());
}

export function buildParecerReportData(
  news: NewsItem,
  labels: LabelConfig[],
  agencyConfig: AgencyConfig,
  currentUser: UserProfile,
): ParecerReportData {
  const rs = news.reportStructure;
  const labelName = rs?.label ?? '';
  const labelConfig = findLabel(labels, labelName);
  const labelColor = labelConfig?.color ?? '#64748b';
  const bodyHtml = parecerToEditorHtml(normalizeReportForEditor(news.report));
  const summary = rs?.summary?.trim() ?? '';
  const reportPlain = htmlToPlainText(normalizeReportForEditor(news.report));
  const lide = summary || reportPlain.split(/\n\n/)[0]?.slice(0, 600) || '';

  return {
    agencyName: agencyConfig.name || 'Agência de Checagem',
    logoUrl: normalizeResourceUrl(agencyConfig.logoUrl),
    referenceNumber: news.referenceNumber,
    generatedAt: formatDateTimePt(new Date().toISOString()),

    processOpenedAt: formatDatePt(news.startTime ?? news.receivedAt ?? news.date),
    verifiers: currentUser.name,
    contentPublishedAt: formatDatePt(news.date),
    investigatedContent: buildInvestigatedContent(news),
    contentMedia: buildContentMedia(news),
    disinfoAuthor: buildDisinfoAuthor(news),
    questions: buildQuestions(news),
    aiSection: buildAiSection(news, agencyConfig),

    publicationLabel: labelName || '—',
    publicationLabelColor: labelColor,
    publicationLabelTextColor: getContrastTextColor(labelColor),
    title: news.title,
    olho: undefined,
    lide,
    bodyHtml,

    checkerName: currentUser.name,
    completedAt: news.completedAt ? formatDateTimePt(news.completedAt) : undefined,
  };
}
