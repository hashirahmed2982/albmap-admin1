import { apiFetch } from './api';
import type {
  AuthResponse,
  Business,
  BusinessEvent,
  ManagedUser,
  DashboardStats,
  ApiListResponse,
  Admin,
  Category,
  BroadcastNotification,
  SiteContent,
  AboutContent,
  SocialLinks,
  LegalPageContent,
} from './types';

// ---------------- Auth ----------------

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
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

export async function getPendingBusinesses(): Promise<Business[]> {
  const res = await apiFetch<ApiListResponse<Business>>('/admin/businesses/pending');
  return res.data;
}

export async function getAllBusinesses(params: {
  status?: string;
  search?: string;
} = {}): Promise<Business[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  const res = await apiFetch<ApiListResponse<Business>>(`/admin/businesses${qs ? `?${qs}` : ''}`);
  return res.data;
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

export function setBusinessActive(id: string, isActive: boolean): Promise<Business> {
  return apiFetch<Business>(`/admin/businesses/${id}/active`, {
    method: 'PATCH',
    body: { isActive },
  });
}

// ---------------- Users ----------------

export async function getAllUsers(search?: string): Promise<ManagedUser[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await apiFetch<ApiListResponse<ManagedUser>>(`/admin/users${qs}`);
  return res.data;
}

export function setUserActive(id: string, isActive: boolean): Promise<void> {
  return apiFetch<void>(`/admin/users/${id}/active`, {
    method: 'PATCH',
    body: { isActive },
  });
}

// ---------------- Events ----------------

export async function getAllEvents(): Promise<BusinessEvent[]> {
  const res = await apiFetch<ApiListResponse<BusinessEvent>>('/admin/events');
  return res.data;
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
