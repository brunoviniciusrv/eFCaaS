const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

export const setToken = (token: string) => sessionStorage.setItem('efcaas_token', token);
export const clearToken = () => sessionStorage.removeItem('efcaas_token');
export const getToken = () => sessionStorage.getItem('efcaas_token');

export const setTenantSlug = (slug: string) => sessionStorage.setItem('efcaas_tenant_slug', slug);
export const clearTenantSlug = () => sessionStorage.removeItem('efcaas_tenant_slug');
export const getTenantSlug = () => sessionStorage.getItem('efcaas_tenant_slug');

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
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      (errBody as any).detail || (errBody as any).message || `Erro ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
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
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      (errBody as any).detail || (errBody as any).message || `Erro ${response.status}`
    );
  }

  return response.json() as Promise<T>;
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
