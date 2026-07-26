// These mirror the backend's response shapes exactly (see
// albmap-backend/src/modules/*/**.service.js's toPublic*() functions).
// Kept as one file since the admin portal's data model is small.

export type BusinessStatus = 'pending' | 'approved' | 'rejected';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  profileImageUrl: string | null;
  role: 'business' | 'admin';
  isEmailVerified: boolean;
}

export interface AuthResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  category: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  whatsappNumber: string | null;
  logoUrl: string | null;
  openingHours: Record<string, string>;
  tags: string[];
  status: BusinessStatus;
  rating: number | null;
  ratingCount?: number;
  isActive?: boolean;
  rejectionReason?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessEvent {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  description: string | null;
  category: string;
  startTime: string;
  endTime: string;
  imageUrl: string | null;
  isActive?: boolean;
  ownerName?: string | null;
  ownerEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  iconName: string | null;
  sortOrder: number;
  businessCount: number;
}

export type BroadcastStatus = 'pending' | 'approved' | 'rejected';

export interface BroadcastNotification {
  id: string;
  businessId: string;
  businessName: string | null;
  type: string;
  title: string;
  body: string;
  relatedId: string | null;
  status: BroadcastStatus;
  rejectionReason: string | null;
  senderName: string | null;
  senderEmail: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalBusinesses: number;
  pendingBusinesses: number;
  approvedBusinesses: number;
  rejectedBusinesses: number;
  totalEvents: number;
  topCategories: { category: string; count: number }[];
  recentActivity: {
    id: string;
    businessName: string;
    newStatus: string;
    createdAt: string;
  }[];
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiErrorResponse {
  message: string;
}
