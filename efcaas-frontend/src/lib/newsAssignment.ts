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
