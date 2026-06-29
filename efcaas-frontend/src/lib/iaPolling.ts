const IA_PENDING_KEY = 'efcaas_ia_pending';

export function getPendingIaConteudoIds(): string[] {
  try {
    const raw = localStorage.getItem(IA_PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPendingIaConteudo(id: string): void {
  const ids = getPendingIaConteudoIds();
  if (!ids.includes(id)) {
    localStorage.setItem(IA_PENDING_KEY, JSON.stringify([...ids, id]));
  }
}

export function removePendingIaConteudo(id: string): void {
  const ids = getPendingIaConteudoIds().filter((x) => x !== id);
  localStorage.setItem(IA_PENDING_KEY, JSON.stringify(ids));
}

export function isIaProcessing(statusIa?: string | null): boolean {
  return statusIa === 'processando';
}

export function isIaFinished(statusIa?: string | null): boolean {
  return statusIa === 'concluida' || statusIa === 'erro';
}
