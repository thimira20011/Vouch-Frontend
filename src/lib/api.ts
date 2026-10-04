export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const apiConfigured = Boolean(apiBaseUrl);

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(15000) });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError('We couldn’t reach Vouch. Check your connection and try again.', 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const fields = body?.errors ?? {};
    const message = response.status === 429 ? 'A few too many requests. Please wait a moment before trying again.'
      : response.status === 401 && token ? 'Your session has ended. Please sign in again.'
      : body?.error ?? (Object.values(fields).flat().join(' ') || 'Something went wrong. Please try again.');
    throw new ApiError(message, response.status, fields);
  }
  return body as T;
}

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
