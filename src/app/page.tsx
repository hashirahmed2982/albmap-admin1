'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Root path just redirects to the right place based on auth state — no UI
 * of its own. Middleware already handles the coarse redirect for /login
 * and protected routes; this covers the bare "/" case.
 */
export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, isLoading, router]);

  return null;
}
