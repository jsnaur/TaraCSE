// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // Fixed import path

export async function middleware(request: NextRequest) {
  // Check if the route is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Explicitly type the cookie parameter to resolve TS7006
    const cookies = request.cookies.getAll();
    const hasAuthCookie = cookies.some((cookie: { name: string }) => 
      cookie.name.includes('supabase') || cookie.name.includes('sb-')
    );

    // If no auth cookie is present, redirect to login
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
     * Match all paths except static assets and public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};