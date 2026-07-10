import { apiFetch } from './api';
import type {
  AuthResponse,
  Business,
  BusinessEvent,
  ManagedUser,
  DashboardStats,
  ApiListResponse,
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
