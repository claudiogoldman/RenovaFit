import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that require authentication
  const protectedRoutes = ['/retencao', '/conversao', '/reativacao', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If accessing a protected route without session, redirect to login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing login page while authenticated, redirect to retencao
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/retencao', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/retencao/:path*',
    '/conversao/:path*',
    '/reativacao/:path*',
    '/admin/:path*',
    '/login',
  ],
};

