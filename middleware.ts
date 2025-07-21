'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const sessionCookie = getSessionCookie(request);

  const isLoggedIn = !!sessionCookie;

  const isOnAuthRoute = nextUrl.pathname.startsWith('/auth');

  if (isOnAuthRoute) {
    // Allow all /auth routes to pass through, regardless of login state
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (isLoggedIn && nextUrl.pathname === '/auth/signin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!_next|api|static|favicon.ico).*)'],
};
