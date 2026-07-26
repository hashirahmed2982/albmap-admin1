import { NextRequest, NextResponse } from 'next/server';

/**
 * Coarse-grained protection: checks only whether the access-token cookie
 * exists, not whether it's still valid — actual validity is verified
 * client-side by AuthProvider (which calls GET /auth/me on mount) and by
 * every API call's 401 handling (see lib/api.ts). This exists purely to
 * stop an unauthenticated user's browser from ever rendering a protected
 * page's content, redirecting to /login before that happens.
 *
 * Named `proxy` (not `middleware`) per the Next.js 16 file convention —
 * this file replaces what used to be middleware.ts.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get('admin_access_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/businesses') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings');

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/businesses/:path*', '/users/:path*', '/events/:path*', '/notifications/:path*', '/settings/:path*', '/login'],
};
