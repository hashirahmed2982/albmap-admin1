import { API_BASE_URL } from './api';

/**
 * The backend returns uploaded-image paths as relative paths (e.g.
 * "/uploads/xxx.png"), not absolute URLs — deliberately, so a stored
 * image reference never goes stale if the backend's externally-reachable
 * address changes later (a new ngrok tunnel each session, a server
 * migration, etc). This resolves such a path against whatever
 * NEXT_PUBLIC_API_URL is currently configured, at render time, rather
 * than trusting a URL baked in at upload time. Mirrors the equivalent
 * helper on the Flutter mobile app side (AppConstants.resolveMediaUrl).
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) {
    // API_BASE_URL includes the "/v1" suffix (e.g. "http://localhost:4000/v1"),
    // but uploaded files are served from the server root, not under /v1.
    const origin = API_BASE_URL.endsWith('/v1') ? API_BASE_URL.slice(0, -3) : API_BASE_URL;
    return `${origin}${path}`;
  }
  return path;
}
