import { Role, Permission, RolePermissions } from '@/types/roles';

export function checkPermission(userRole: Role, permission: Permission): boolean {
  const roleConfig = RolePermissions[userRole];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
}

export function checkMultiplePermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => checkPermission(userRole, permission));
}

export function getUserPermissions(userRole: Role): Permission[] {
  const roleConfig = RolePermissions[userRole];
  return roleConfig?.permissions || [];
}

export function canAccessRoute(userRole: Role, route: string): boolean {
  const roleConfig = RolePermissions[userRole];
  if (!roleConfig) return false;

  return roleConfig.routes.some(allowedRoute => {
    if (allowedRoute === route) return true;
    if (route.startsWith(allowedRoute + '/')) return true;
    return false;
  });
}

export function hasEditPermission(userRole: Role, resource: string): boolean {
  return checkPermission(userRole, `update:${resource}` as Permission);
}

export function hasCreatePermission(userRole: Role, resource: string): boolean {
  return checkPermission(userRole, `create:${resource}` as Permission);
}

export function hasDeletePermission(userRole: Role, resource: string): boolean {
  return checkPermission(userRole, `delete:${resource}` as Permission);
}

// Custom permission checks for specific roles
export function isTeacherWithCourseAccess(userRole: Role, courseId: string): boolean {
  if (userRole !== 'docente') return false;
  // Here you would implement the logic to check if the teacher
  // is assigned to this specific course
  // This would typically involve checking against a database
  return true; // Placeholder - implement actual logic
}

export function isGuardianWithStudentAccess(userRole: Role, studentId: string): boolean {
  if (userRole !== 'apoderado') return false;
  // Here you would implement the logic to check if the guardian
  // is associated with this specific student
  // This would typically involve checking against a database
  return true; // Placeholder - implement actual logic
}

export function isSupportStaffWithStudentAccess(userRole: Role, studentId: string): boolean {
  if (userRole !== 'apoyo') return false;
  // Here you would implement the logic to check if the support staff
  // is assigned to this specific student
  // This would typically involve checking against a database
  return true; // Placeholder - implement actual logic
}