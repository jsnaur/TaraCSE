// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the route is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Look for Supabase auth cookies. The specific cookie name depends on your Supabase config,
    // but looking for the generic 'sb-' prefix or standard auth tokens acts as a fast initial filter.
    const hasAuthCookie = request.cookies.getAll().some(cookie => cookie.name.includes('supabase') || cookie.name.includes('sb-'));

    // If no auth cookie is present, redirect to login immediately without hitting the server
    if (!hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g., .svg files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};