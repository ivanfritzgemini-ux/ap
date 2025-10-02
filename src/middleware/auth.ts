import { NextRequest, NextResponse } from 'next/server';
import { RolePermissions, Role } from '@/types/roles';

// Helper function to check if a user has access to a route based on their role
function hasRouteAccess(userRole: Role, requestedPath: string): boolean {
  const roleConfig = RolePermissions[userRole];
  if (!roleConfig) return false;

  return roleConfig.routes.some(route => {
    // Exact match
    if (route === requestedPath) return true;
    // Parent route match (e.g., /estudiantes/123 matches /estudiantes)
    if (requestedPath.startsWith(route + '/')) return true;
    // Special case for profile routes
    if (route === '/estudiantes/perfil' && requestedPath.startsWith('/estudiantes/') && requestedPath.includes('/perfil')) return true;
    return false;
  });
}

// Helper function to check if a user has a specific permission
export function hasPermission(userRole: Role, permission: string): boolean {
  const roleConfig = RolePermissions[userRole];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission as any);
}

// Middleware to protect routes based on user role
export async function authMiddleware(request: NextRequest) {
  const session = request.cookies.get('session'); // Adjust based on your session management
  
  // If no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Decode the session to get user role (implement according to your session structure)
    const user = JSON.parse(atob(session.value));
    const role = user.role as Role;
    const path = request.nextUrl.pathname;

    // Check if user has access to the requested route
    if (!hasRouteAccess(role, path)) {
      // Redirect to 403 page or show error
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Add role to headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', role);

    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}