'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ToastProvider';

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

// Anything that indicates a human is actually at the keyboard/screen —
// deliberately not `mouseover`/`focus`, which can fire from a background
// tab or a stray window-manager event with no real user present.
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;

/**
 * Admin-portal-specific requirement — not the mobile app or the public
 * website, both of which keep a session alive indefinitely (a business
 * owner might read a long review thread before doing anything). The
 * admin portal handles real user PII (emails, phone numbers) and account
 * bans, so it logs an idle admin out after 15 minutes with zero
 * mouse/keyboard/touch/scroll activity, regardless of whether their
 * access token is technically still valid.
 *
 * Pass `enabled` rather than always running — ProtectedLayout only turns
 * this on once `user` is actually set, so the countdown doesn't start
 * while still loading/unauthenticated on first paint.
 */
export function useInactivityLogout(enabled: boolean) {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs so the event-listener effect below doesn't need `logout`/
  // `showToast` in its dependency array — neither is guaranteed to be a
  // stable reference across renders, and re-running that effect on every
  // render would mean constantly tearing down and re-adding six
  // window-level listeners for no reason.
  const logoutRef = useRef(logout);
  const showToastRef = useRef(showToast);
  useEffect(() => {
    logoutRef.current = logout;
    showToastRef.current = showToast;
  });

  useEffect(() => {
    if (!enabled) return;

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        showToastRef.current("You've been signed out after 15 minutes of inactivity", 'error');
        logoutRef.current();
      }, INACTIVITY_LIMIT_MS);
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);
}
