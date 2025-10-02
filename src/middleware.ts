import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './middleware/auth';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/registro', '/recuperar-clave', '/api/auth'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the requested path is a public route
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // For all other routes, apply auth middleware
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
