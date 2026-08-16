import { apiFetch, API_BASE_URL, ApiError } from './api';
import { getAccessToken } from './tokens';
import type {
  AuthResponse,
  Business,
  BusinessEvent,
  BusinessImportResult,
  ManagedUser,
  DashboardStats,
  ApiListResponse,
  PaginatedResponse,
  ListParams,
  Admin,
  Category,
  BroadcastNotification,
  SiteContent,
  AboutContent,
  SocialLinks,
  LegalPageContent,
} from './types';

/** Serializes a ListParams (+ any extra string params) into a "?a=b&c=d"
 * query string, omitting anything empty/undefined — shared by every
 * paginated list call below so each one isn't hand-rolling its own
 * URLSearchParams. Accepts any plain params object (ListParams plus
 * whatever extra filter fields a specific endpoint adds, e.g.
 * getAllBusinesses' `status`) — the index-signature cast is just to
 * satisfy Object.entries' typing, every value is still a plain
 * string/number/undefined at runtime. */
function buildListQuery(params: object): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, string | number | undefined>)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

// ---------------- Auth ----------------

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

/**
 * Revokes the refresh token server-side (see albmap-backend's
 * auth.service.js `logout`, which sets `revoked_at` on the matching
 * refresh_tokens row) so it can't be used to silently mint new access
 * tokens after this browser has been signed out — otherwise "logout"
 * (manual or the 15-min inactivity auto-logout) only ever clears local
 * cookies, and the token itself stays valid for its full 30-day life.
 * `skipAuth: true` because the route takes no auth middleware — it only
 * needs the refresh token in the body — and the access token may already
 * be expired/gone by the time this fires.
 */
export function logout(refreshToken: string): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
  });
}

export function getCurrentUser() {
  return apiFetch<AuthResponse['user']>('/auth/me');
}

// ---------------- Dashboard ----------------

export function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/admin/dashboard');
}

// ---------------- Businesses ----------------

export function getPendingBusinesses(params: ListParams = {}): Promise<PaginatedResponse<Business>> {
  return apiFetch<PaginatedResponse<Business>>(`/admin/businesses/pending${buildListQuery(params)}`);
}

export function getAllBusinesses(
  params: ListParams & { status?: string } = {},
): Promise<PaginatedResponse<Business>> {
  return apiFetch<PaginatedResponse<Business>>(`/admin/businesses${buildListQuery(params)}`);
}

export function reviewBusiness(
  id: string,
  decision: 'approved' | 'rejected',
  reason?: string,
): Promise<Business> {
  return apiFetch<Business>(`/admin/businesses/${id}/review`, {
    method: 'PATCH',
    body: { decision, reason },
  });
}

export function setBusinessActive(id: string, isActive: boolean, reason?: string): Promise<Business> {
  return apiFetch<Business>(`/admin/businesses/${id}/active`, {
    method: 'PATCH',
    body: { isActive, reason },
  });
}

/**
 * Bypasses apiFetch — it always sets Content-Type: application/json and
 * JSON.stringifies the body, which would corrupt a multipart file
 * upload. Manually attaches the same Authorization header apiFetch
 * would, but skips its silent-401-refresh-and-retry logic (an admin's
 * session expiring mid-import is rare enough not to be worth
 * replicating that here — they'll just see the resulting 401 and know
 * to log back in and retry the whole file).
 */
export async function importBusinessesCsv(file: File): Promise<BusinessImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/admin/businesses/import`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    let message = `Import failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response wasn't JSON — fall back to the generic message above
    }
    throw new ApiError(res.status, message);
  }
  return res.json();
}

// ---------------- Users ----------------

export function getAllUsers(params: ListParams = {}): Promise<PaginatedResponse<ManagedUser>> {
  return apiFetch<PaginatedResponse<ManagedUser>>(`/admin/users${buildListQuery(params)}`);
}

export function setUserActive(id: string, isActive: boolean, reason?: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${id}/active`, {
    method: 'PATCH',
    body: { isActive, reason },
  });
}

/**
 * Downloads the CSV and triggers a save-as via a throwaway <a download>
 * element — the standard way to save a fetched blob, since a plain
 * `<a href="...">` can't attach the Authorization header this endpoint
 * requires. Bypasses apiFetch for the same reason importBusinessesCsv
 * does (it always parses the response as JSON, which a CSV body isn't).
 */
export async function downloadUsersCsv(): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/admin/users/export.csv`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new ApiError(res.status, `Export failed with status ${res.status}`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `albmap-users-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------- Events ----------------

export function getAllEvents(params: ListParams = {}): Promise<PaginatedResponse<BusinessEvent>> {
  return apiFetch<PaginatedResponse<BusinessEvent>>(`/admin/events${buildListQuery(params)}`);
}

export function setEventActive(id: string, isActive: boolean): Promise<void> {
  return apiFetch<void>(`/admin/events/${id}/active`, {
    method: 'PATCH',
    body: { isActive },
  });
}

// ---------------- Admin accounts ----------------
// Fixes a real gap: previously only one admin account existed (whatever
// the backend's db:seed created), with no in-app way to add a second one
// or remove access from a departing admin.

export async function getAllAdmins(): Promise<Admin[]> {
  const res = await apiFetch<ApiListResponse<Admin>>('/admin/admins');
  return res.data;
}

export function createAdmin(email: string, password: string, name: string): Promise<Admin> {
  return apiFetch<Admin>('/admin/admins', {
    method: 'POST',
    body: { email, password, name },
  });
}

export function deleteAdmin(id: string): Promise<void> {
  return apiFetch<void>(`/admin/admins/${id}`, { method: 'DELETE' });
}

// ---------------- Categories ----------------
// Fixes a real gap: category names were previously fixed at whatever
// db:seed created, with no way to add/rename/remove one without a direct
// database edit. The mobile app already fetches categories dynamically
// (GET /categories) — this just gives the admin a UI to actually manage
// what that list contains.

export async function getAllCategories(): Promise<Category[]> {
  const res = await apiFetch<ApiListResponse<Category>>('/admin/categories');
  return res.data;
}

export function createCategory(name: string, iconName?: string): Promise<Category> {
  return apiFetch<Category>('/admin/categories', {
    method: 'POST',
    body: { name, iconName },
  });
}

export function renameCategory(id: number, name: string): Promise<Category> {
  return apiFetch<Category>(`/admin/categories/${id}`, {
    method: 'PATCH',
    body: { name },
  });
}

export function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`/admin/categories/${id}`, { method: 'DELETE' });
}

// ---------------- Notifications ----------------
// A business owner's broadcast sits pending here until an admin approves
// it — approving is what actually triggers delivery to every registered
// device (see the backend's notification.service.js reviewBroadcast()).

export async function getPendingBroadcasts(): Promise<BroadcastNotification[]> {
  const res = await apiFetch<ApiListResponse<BroadcastNotification>>('/admin/notifications/pending');
  return res.data;
}

export async function getAllBroadcasts(status?: string): Promise<BroadcastNotification[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await apiFetch<ApiListResponse<BroadcastNotification>>(`/admin/notifications${qs}`);
  return res.data;
}

export function reviewBroadcast(
  id: string,
  decision: 'approved' | 'rejected',
  reason?: string,
): Promise<{ id: string; status: string; delivery: { delivered: boolean; reason?: string } }> {
  return apiFetch(`/admin/notifications/${id}/review`, {
    method: 'PATCH',
    body: { decision, reason },
  });
}

// ---------------- Site content ----------------
// About Us, social links, Privacy Policy, and Terms & Conditions — see
// albmap-backend's content module. GET /content is public (both the
// mobile app and website read it unauthenticated), so this portal reads
// it the same way rather than duplicating that call under /admin; only
// the PUT is admin-only.

export function getContent(): Promise<SiteContent> {
  return apiFetch<SiteContent>('/content', { skipAuth: true });
}

export function updateAboutUs(data: Omit<AboutContent, 'updatedAt'>): Promise<AboutContent> {
  return apiFetch<AboutContent>('/admin/content/about_us', { method: 'PUT', body: data });
}

export function updateSocialLinks(data: Omit<SocialLinks, 'updatedAt'>): Promise<SocialLinks> {
  return apiFetch<SocialLinks>('/admin/content/social_links', { method: 'PUT', body: data });
}

export function updatePrivacyPolicy(
  data: Omit<LegalPageContent, 'updatedAt'>,
): Promise<LegalPageContent> {
  return apiFetch<LegalPageContent>('/admin/content/privacy_policy', { method: 'PUT', body: data });
}

export function updateTermsConditions(
  data: Omit<LegalPageContent, 'updatedAt'>,
): Promise<LegalPageContent> {
  return apiFetch<LegalPageContent>('/admin/content/terms_conditions', {
    method: 'PUT',
    body: data,
  });
}
