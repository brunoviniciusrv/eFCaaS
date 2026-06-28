declare global {
  interface Window {
    __EFCAAS_CONFIG__?: { apiUrl?: string };
  }
}

const DEFAULT_API_URL = 'http://localhost:8081/api/v1';
const RUNTIME_PLACEHOLDER = '__RUNTIME_API_URL__';

function isPlaceholder(value: string | undefined): boolean {
  return !value || value.includes('__RUNTIME_API_URL__');
}

/** Normaliza URL da API (Railway exige https:// explícito). */
export function normalizeApiBaseUrl(raw: string | undefined): string {
  if (!raw || isPlaceholder(raw)) return '';

  const trimmed = raw.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Ex.: backend-production-58d7.up.railway.app/api/v1 (sem protocolo)
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function resolveApiBaseUrl(): string {
  const runtime = normalizeApiBaseUrl(window.__EFCAAS_CONFIG__?.apiUrl);
  if (runtime) return runtime;

  const buildTime = normalizeApiBaseUrl(import.meta.env.VITE_API_URL as string | undefined);
  if (buildTime) return buildTime;

  return DEFAULT_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Normaliza URLs de recursos (anexos, evidências) retornadas pela API. */
export function normalizeResourceUrl(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const absolute = normalizeApiBaseUrl(trimmed);
  if (/^https?:\/\//i.test(absolute)) return absolute;

  if (trimmed.startsWith('/')) {
    const apiRoot = API_BASE_URL.replace(/\/api\/v1\/?$/i, '');
    return `${apiRoot}${trimmed}`;
  }

  return trimmed;
}
