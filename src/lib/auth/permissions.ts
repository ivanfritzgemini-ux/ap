import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { RolePermissions, type Role, type Permission } from '@/types/roles';

interface UserWithRole {
  id: string;
  email?: string;
  role: Role;
}

/**
 * Get the current authenticated user with their role
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: profile } = await supabase
      .from('usuarios')
      .select('rol:rol_id(nombre_rol)')
      .eq('id', user.id)
      .single();

    if (!profile?.rol) return null;

    const userRole = Array.isArray(profile.rol) 
      ? (profile.rol[0] as any)?.nombre_rol 
      : (profile.rol as any)?.nombre_rol;

    // Normalize role names
    let normalizedRole: Role;
    switch (userRole?.toLowerCase()) {
      case 'administrador':
      case 'admin':
        normalizedRole = 'admin';
        break;
      case 'directivo':
      case 'director':
        normalizedRole = 'directivo';
        break;
      case 'docente':
      case 'profesor':
      case 'teacher':
        normalizedRole = 'docente';
        break;
      case 'apoyo':
      case 'support':
        normalizedRole = 'apoyo';
        break;
      case 'apoderado':
      case 'parent':
      case 'guardian':
        normalizedRole = 'apoderado';
        break;
      case 'estudiante':
      case 'student':
        normalizedRole = 'estudiante';
        break;
      default:
        return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: normalizedRole
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user has permission for a specific action
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const roleConfig = RolePermissions[userRole];
  return roleConfig?.permissions.includes(permission) || false;
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userRole: Role, route: string): boolean {
  const roleConfig = RolePermissions[userRole];
  if (!roleConfig) return false;

  return roleConfig.routes.some(allowedRoute => {
    return route === allowedRoute || route.startsWith(allowedRoute + '/');
  });
}

/**
 * Require authentication and specific role for a page
 * This should be called at the top of server components that need protection
 */
export async function requireAuth(options?: {
  requiredRole?: Role | Role[];
  requiredPermission?: Permission;
  requiredRoute?: string;
  redirectTo?: string;
}): Promise<UserWithRole> {
  const user = await getCurrentUserWithRole();

  // Check if user is authenticated
  if (!user) {
    redirect(options?.redirectTo || '/login');
  }

  // Check role requirement
  if (options?.requiredRole) {
    const requiredRoles = Array.isArray(options.requiredRole) 
      ? options.requiredRole 
      : [options.requiredRole];
    
    if (!requiredRoles.includes(user.role)) {
      console.warn(`Access denied: ${user.role} does not match required roles: ${requiredRoles.join(', ')}`);
      redirect('/access-denied?reason=insufficient_role');
    }
  }

  // Check permission requirement
  if (options?.requiredPermission && !hasPermission(user.role, options.requiredPermission)) {
    console.warn(`Access denied: ${user.role} lacks permission: ${options.requiredPermission}`);
    redirect('/access-denied?reason=insufficient_permission');
  }

  // Check route requirement
  if (options?.requiredRoute && !canAccessRoute(user.role, options.requiredRoute)) {
    console.warn(`Access denied: ${user.role} cannot access route: ${options.requiredRoute}`);
    redirect('/access-denied?reason=route_forbidden');
  }

  return user;
}

/**
 * Require admin role specifically
 */
export async function requireAdmin(): Promise<UserWithRole> {
  return requireAuth({ 
    requiredRole: 'admin',
    redirectTo: '/access-denied?reason=admin_required'
  });
}

/**
 * Require teacher role specifically
 */
export async function requireTeacher(): Promise<UserWithRole> {
  return requireAuth({ 
    requiredRole: 'docente',
    redirectTo: '/dashboard'
  });
}

/**
 * Require admin or directivo roles
 */
export async function requireAdminOrDirector(): Promise<UserWithRole> {
  return requireAuth({ 
    requiredRole: ['admin', 'directivo'],
    redirectTo: '/dashboard'
  });
}