'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { storeTokens, clearTokens, getAccessToken, getRefreshToken } from '@/lib/tokens';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import type { AdminUser } from '@/lib/types';

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // On mount, if a token cookie exists, verify it's still valid and
    // belongs to an admin before trusting it — a stale/expired cookie
    // shouldn't silently grant access to protected pages.
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then((fetchedUser) => {
        if (fetchedUser.role !== 'admin') {
          clearTokens();
          setUser(null);
        } else {
          setUser(fetchedUser);
        }
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await apiLogin(email, password);
    if (result.user.role !== 'admin') {
      throw new ApiError(403, 'This account does not have admin access.');
    }
    storeTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    router.push('/dashboard');
  }

  function logout() {
    // Read the refresh token before clearing it — this is the one that
    // needs revoking server-side so it can't keep minting fresh access
    // tokens after this browser is "logged out".
    const refreshToken = getRefreshToken();

    clearTokens();
    setUser(null);
    router.push('/login');

    // Fire-and-forget: the local sign-out above is what actually protects
    // this browser and must never wait on the network. If this call fails
    // (backend briefly down, offline, etc.) the token just lives out its
    // normal 30-day life instead of being cut short — not worth blocking
    // or retrying the UI redirect for.
    if (refreshToken) {
      apiLogout(refreshToken).catch(() => {});
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
