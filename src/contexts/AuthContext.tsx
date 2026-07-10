'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { storeTokens, clearTokens, getAccessToken } from '@/lib/tokens';
import { login as apiLogin, getCurrentUser } from '@/lib/admin-api';
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
    clearTokens();
    setUser(null);
    router.push('/login');
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
