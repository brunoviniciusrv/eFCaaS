import { API_BASE_URL } from '../lib/apiBaseUrl';

function apiMisconfiguredMessage(): string {
  return (
    'A API retornou HTML em vez de JSON. Confira VITE_API_URL no serviço Frontend do Railway ' +
    `(valor atual: ${API_BASE_URL}) — deve ser https://backend-....up.railway.app/api/v1 ` +
    'e apontar para o serviço backend, não para o frontend. Depois, redeploy/restart do frontend.'
  );
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.trimStart().toLowerCase().startsWith('<!doctype') || text.trimStart().startsWith('<html')) {
      throw new Error(apiMisconfiguredMessage());
    }
    throw new Error('Resposta inválida da API.');
  }
}

const TOKEN_KEY = 'efcaas_token';
const TENANT_SLUG_KEY = 'efcaas_tenant_slug';

function readStored(key: string): string | null {
  const fromLocal = localStorage.getItem(key);
  if (fromLocal) return fromLocal;

  const fromSession = sessionStorage.getItem(key);
  if (fromSession) {
    localStorage.setItem(key, fromSession);
    sessionStorage.removeItem(key);
    return fromSession;
  }
  return null;
}

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};
export const getToken = () => readStored(TOKEN_KEY);

export const setTenantSlug = (slug: string) => localStorage.setItem(TENANT_SLUG_KEY, slug);
export const clearTenantSlug = () => {
  localStorage.removeItem(TENANT_SLUG_KEY);
  sessionStorage.removeItem(TENANT_SLUG_KEY);
};
export const getTenantSlug = () => readStored(TENANT_SLUG_KEY);

/** Chave de localStorage isolada por tenant (retorna null se slug ausente). */
export function tenantStorageKey(suffix: string): string | null {
  const slug = getTenantSlug();
  return slug ? `tenant_${slug}_${suffix}` : null;
}

type RequestOptions = {
  skipAuth?: boolean;
  tenantSlug?: string;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.skipAuth ? null : getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const tenantSlug = options.tenantSlug ?? getTenantSlug();
  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !options.skipAuth) {
    clearToken();
    clearTenantSlug();
    window.location.hash = '#/';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    let errBody: Record<string, unknown> = {};
    try {
      errBody = await parseJsonResponse<Record<string, unknown>>(response);
    } catch (err) {
      if (err instanceof Error && err.message.includes('HTML')) {
        throw err;
      }
    }
    throw new Error(
      (errBody as any).detail || (errBody as any).message || `Erro ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return parseJsonResponse<T>(response);
}

async function uploadRequest<T>(
  path: string,
  formData: FormData,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.skipAuth ? null : getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const tenantSlug = options.tenantSlug ?? getTenantSlug();
  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new Error(
      'Não foi possível enviar o arquivo. Verifique se VITE_API_URL aponta para a API ' +
      '(Docker: http://localhost:8081/api/v1). Proxies nginx bloqueiam uploads acima de ~1 MB ' +
      'se client_max_body_size não estiver configurado.'
    );
  }

  if (response.status === 401 && !options.skipAuth) {
    clearToken();
    clearTenantSlug();
    window.location.hash = '#/';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(
        'Arquivo rejeitado pelo proxy (413). Use a API direta em http://localhost:8081/api/v1 ' +
        'ou aumente client_max_body_size no nginx.'
      );
    }
    let errBody: Record<string, unknown> = {};
    try {
      errBody = await parseJsonResponse<Record<string, unknown>>(response);
    } catch (err) {
      if (err instanceof Error && err.message.includes('HTML')) {
        throw err;
      }
    }
    throw new Error(
      (errBody as any).detail || (errBody as any).message || `Erro ${response.status}`
    );
  }

  return parseJsonResponse<T>(response);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    uploadRequest<T>(path, formData, options),
};
