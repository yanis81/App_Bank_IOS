/**
 * Client HTTP centralisé pour l'API backend.
 * Utilise le JWT Clerk pour l'authentification.
 * Gère les timeouts, le retry et la sérialisation.
 *
 * @module data/api/api-client
 */

import { getClerkInstance } from '@clerk/expo';

import { env } from '@/core/config/env';
import { NETWORK_TIMEOUT_MS, MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY_MS, API_V1_PREFIX, API_CLIENT_VERSION, APP_VERSION } from '@/core/config/constants';
import { NetworkError, UnauthorizedError } from '@/core/errors';
import { logger } from '@/core/logger';
import type { ApiResult } from '@/core/types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly skipAuth?: boolean;
  readonly retryCount?: number;
}

/**
 * Effectue un appel HTTP avec timeout.
 */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('La requête a expiré (timeout)', { url, timeoutMs });
    }
    throw new NetworkError('Erreur réseau', { url, originalError: String(error) });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Attend un délai avant de retry (backoff exponentiel).
 */
function wait(attemptIndex: number): Promise<void> {
  const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attemptIndex);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Effectue une requête API vers le backend.
 *
 * @param options - Options de la requête.
 * @returns Les données de réponse typées.
 * @throws {NetworkError} Si la connexion échoue après les retries.
 * @throws {UnauthorizedError} Si le token est invalide (HTTP 401).
 */
export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const { method, path, body, headers: customHeaders, skipAuth = false, retryCount = 0 } = options;
  const url = `${env.API_BASE_URL}${API_V1_PREFIX}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': API_CLIENT_VERSION,
    'X-App-Version': APP_VERSION,
    ...customHeaders,
  };

  if (!skipAuth) {
    const clerk = getClerkInstance();
    const token = await clerk.session?.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetchWithTimeout(url, init, NETWORK_TIMEOUT_MS);

    if (response.status === 401) {
      throw new UnauthorizedError();
    }

    const json: unknown = await response.json();
    const result = json as ApiResult<T>;

    if (!response.ok || !('success' in result) || !result.success) {
      const errorResult = result as { error?: { code?: string; message?: string } };
      const message = errorResult.error?.message ?? `Erreur HTTP ${response.status}`;
      throw new NetworkError(message, { status: response.status, path });
    }

    return result.data;
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    if (retryCount < MAX_RETRY_ATTEMPTS && error instanceof NetworkError) {
      logger.warn(`Retry ${retryCount + 1}/${MAX_RETRY_ATTEMPTS} pour ${method} ${path}`);
      await wait(retryCount);
      return apiRequest<T>({ ...options, retryCount: retryCount + 1 });
    }

    throw error;
  }
}

/** Raccourcis HTTP. */
export const api = {
  get: <T>(path: string) => apiRequest<T>({ method: 'GET', path }),
  post: <T>(path: string, body?: Record<string, unknown>, skipAuth?: boolean) =>
    apiRequest<T>({ method: 'POST', path, body, skipAuth }),
  put: <T>(path: string, body?: Record<string, unknown>) =>
    apiRequest<T>({ method: 'PUT', path, body }),
  delete: <T>(path: string) => apiRequest<T>({ method: 'DELETE', path }),
} as const;
