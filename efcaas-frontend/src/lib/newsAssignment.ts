import type { AssignmentHistory, NewsItem } from '../types';
import type { ApiChecagemDto, ApiHistoricoAtribuicaoDto } from '../services/apiService';

export function isNewsAssignedTo(item: NewsItem, userId: string): boolean {
  if (item.assignedToIds?.includes(userId)) return true;
  return item.assignedTo === userId;
}

function mapHistoricoAction(acao: string): AssignmentHistory['action'] {
  if (acao === 'reopened') return 'reopened';
  if (acao === 'reassigned') return 'reassigned';
  if (acao === 'rejected') return 'rejected';
  if (acao === 'assumed') return 'assumed';
  if (acao === 'removed') return 'removed';
  return 'assigned';
}

export function mapHistoricoAtribuicao(h: ApiHistoricoAtribuicaoDto): AssignmentHistory {
  return {
    id: h.id,
    assignedTo: h.usuarioId ?? '',
    assignedToName: h.usuarioNome ?? undefined,
    assignedBy: h.atribuidoPorId ?? '',
    assignedByName: h.atribuidoPorNome ?? undefined,
    timestamp: h.timestamp ?? new Date().toISOString(),
    action: mapHistoricoAction(h.acao),
    reason: h.motivo ?? undefined,
  };
}

export interface RectificationReason {
  text: string;
  authorName?: string;
  timestamp?: string;
  label: string;
}

/** Motivo mais recente de retificação/reabertura para conteúdos em `to_rectify`. */
export function getRectificationReason(news: NewsItem): RectificationReason | null {
  if (news.status !== 'to_rectify') return null;

  const fromHistory = [...(news.assignmentHistory ?? [])]
    .filter(
      (h) =>
        (h.action === 'rejected' || h.action === 'reopened') &&
        Boolean(h.reason?.trim()),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];

  if (fromHistory) {
    return {
      text: fromHistory.reason!.trim(),
      authorName: fromHistory.assignedByName ?? fromHistory.assignedToName,
      timestamp: fromHistory.timestamp,
      label:
        fromHistory.action === 'reopened'
          ? 'Motivo da reabertura'
          : 'Motivo da retificação',
    };
  }

  if (news.reviewComments?.trim()) {
    return {
      text: news.reviewComments.trim(),
      label: 'Motivo da retificação',
    };
  }

  return null;
}

/** Fallback via auditoria quando o motivo não veio no histórico de atribuição. */
export function getRectificationReasonFromAuditoria(
  logs: {
    acao: string;
    detalhes: string | null;
    usuarioNome: string;
    timestamp: string;
  }[],
): RectificationReason | null {
  const match = logs.find(
    (l) =>
      (l.acao === 'revisao_rejeitada' || l.acao === 'conteudo_reaberto') &&
      Boolean(l.detalhes?.trim()),
  );
  if (!match?.detalhes?.trim()) return null;
  return {
    text: match.detalhes.trim(),
    authorName: match.usuarioNome,
    timestamp: match.timestamp,
    label:
      match.acao === 'conteudo_reaberto'
        ? 'Motivo da reabertura'
        : 'Motivo da retificação',
  };
}

/** Briefings de atribuição com orientação (exclui auto-assunção sem texto do curador). */
export function getAssignmentBriefings(history?: AssignmentHistory[]) {
  return (history ?? [])
    .filter(
      (h) =>
        h.action === 'assigned' &&
        Boolean(h.reason?.trim()) &&
        h.reason !== 'Assumiu a tarefa',
    )
    .map((h) => ({
      id: h.id,
      authorName: h.assignedByName ?? 'Curador',
      checkerName: h.assignedToName,
      text: h.reason!.trim(),
      timestamp: h.timestamp,
    }));
}

export function resolveCheckerFromQuery(
  query: string,
  checkers: { id: string; name: string; email?: string }[],
  excludeIds: string[] = [],
): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const pool = checkers.filter((c) => !excludeIds.includes(c.id));
  const exact = pool.find(
    (c) => c.name.toLowerCase() === q || c.email?.toLowerCase() === q,
  );
  if (exact) return exact.id;
  const partial = pool.filter((c) => c.name.toLowerCase().includes(q));
  if (partial.length === 1) return partial[0].id;
  return null;
}

export function mergeChecagemIntoNews(news: NewsItem, checagem: ApiChecagemDto): NewsItem {
  const checadorIds = checagem.checadorIds?.length
    ? checagem.checadorIds
    : checagem.checadorId
      ? [checagem.checadorId]
      : news.assignedToIds ?? (news.assignedTo ? [news.assignedTo] : []);

  const historico = checagem.historicoAtribuicao?.map(mapHistoricoAtribuicao);

  return {
    ...news,
    checagemId: checagem.id ?? news.checagemId,
    assignedTo: checadorIds[0] || undefined,
    assignedToIds: checadorIds.length > 0 ? checadorIds : undefined,
    briefing: checagem.briefing?.trim() || undefined,
    startTime: checagem.dataInicio ?? news.startTime,
    completedAt: checagem.dataConclusao ?? news.completedAt,
    assignmentHistory: historico ?? news.assignmentHistory ?? [],
  };
}
