import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ['/retencao', '/conversao', '/reativacao', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Get the session from cookies
  const supabaseSession = request.cookies.get('sb-' + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.split('.')[0] || ''));
  const hasSession = !!supabaseSession?.value || !!request.cookies.get('sb-auth-token')?.value;

  // If accessing a protected route without session, redirect to login
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing login page while authenticated, redirect to retencao
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/retencao', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect these routes
    '/retencao/:path*',
    '/conversao/:path*',
    '/reativacao/:path*',
    '/admin/:path*',
    '/login',
  ],
};
