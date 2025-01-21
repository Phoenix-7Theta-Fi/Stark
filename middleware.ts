import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicPaths = ['/login', '/register', '/'];

  // If no token and not a public path, redirect to login
  if (!token && !publicPaths.includes(path)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists, check role-based access
  if (token) {
    const userRole = token.role as string;

    // User-specific routes
    if (path.startsWith('/user') && userRole !== 'user') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Practitioner-specific routes
    if (path.startsWith('/practitioner') && userRole !== 'practitioner') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

// Paths where middleware will run
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};