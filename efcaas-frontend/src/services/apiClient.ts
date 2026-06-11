const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

export const setToken = (token: string) => sessionStorage.setItem('efcaas_token', token);
export const clearToken = () => sessionStorage.removeItem('efcaas_token');
export const getToken = () => sessionStorage.getItem('efcaas_token');

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    clearToken();
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

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

  if (response.status === 401) {
    clearToken();
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
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),
};
