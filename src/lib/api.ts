'use client';

import { getAccessToken, getRefreshToken, storeTokens, clearTokens } from './tokens';
import type { ApiErrorResponse } from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts a silent token refresh, matching the mobile app's DioClient
 * interceptor (lib/core/network/dio_client.dart) — same backend endpoint,
 * same request/response shape. De-duplicated via a shared in-flight
 * promise so concurrent 401s from multiple simultaneous requests don't
 * each trigger their own refresh call.
 */
function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Bypasses ngrok free-tier's browser-warning interstitial page —
          // without this, ngrok serves its own HTML page instead of
          // forwarding to the real backend, which has no CORS headers at
          // all and looks exactly like a CORS failure in devtools.
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      storeTokens(data.accessToken, refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip attaching the Authorization header — only /auth/login and /auth/signup need this. */
  skipAuth?: boolean;
}

/**
 * Central fetch wrapper: attaches the Bearer token, retries once on 401
 * after a silent refresh, and throws ApiError with the backend's actual
 * message on failure (matching { message } — see
 * albmap-backend/src/middleware/errorHandler.js).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      // Bypasses ngrok free-tier's browser-warning interstitial page —
      // without this, the free tier serves its own HTML page to any
      // browser tab hitting the tunnel for the first time, instead of
      // forwarding to the real backend. That interstitial has no CORS
      // headers at all, which shows up in devtools as "No
      // Access-Control-Allow-Origin header," looking exactly like a CORS
      // misconfiguration even though the actual Express CORS setup is
      // completely fine — the request just never reached it.
      'ngrok-skip-browser-warning': 'true',
      ...(headers as Record<string, string> | undefined),
    };
    if (!skipAuth) {
      const token = getAccessToken();
      if (token) finalHeaders.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await doFetch();

  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await doFetch();
    } else {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new ApiError(401, 'Session expired — please log in again.');
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody: ApiErrorResponse = await response.json();
      if (errorBody?.message) message = errorBody.message;
    } catch {
      // Response body wasn't JSON — fall back to the generic message above.
    }
    throw new ApiError(response.status, message);
  }

  // 204 No Content responses (e.g. PATCH .../active) have no body to parse.
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}