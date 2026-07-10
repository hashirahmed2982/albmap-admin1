'use client';

// Plain, non-httpOnly cookies — a deliberate simplification for this
// internal admin tool. This means the tokens are readable by any JS on the
// page (a real XSS risk in a public-facing product), which is why they're
// NOT used this way in the mobile app (which uses flutter_secure_storage,
// OS-level secure storage) or recommended for a customer-facing website.
// For an admin portal used only by trusted staff, this trade-off buys a
// much simpler architecture (no Next.js API route proxy layer needed for
// every single request). If you later expose this admin portal beyond a
// small trusted team, move to httpOnly cookies set via Next.js Route
// Handlers instead.

const ACCESS_TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';
const COOKIE_MAX_AGE_DAYS = 30;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function storeTokens(accessToken: string, refreshToken: string) {
  setCookie(ACCESS_TOKEN_KEY, accessToken, COOKIE_MAX_AGE_DAYS);
  setCookie(REFRESH_TOKEN_KEY, refreshToken, COOKIE_MAX_AGE_DAYS);
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}
