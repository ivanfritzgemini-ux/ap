export type Role = 'admin' | 'directivo' | 'docente' | 'apoyo' | 'apoderado' | 'estudiante';

export type Permission = 
  | 'create:users'
  | 'read:users'
  | 'update:users'
  | 'delete:users'
  | 'create:students'
  | 'read:students'
  | 'update:students' 
  | 'delete:students'
  | 'create:teachers'
  | 'read:teachers'
  | 'update:teachers'
  | 'delete:teachers'
  | 'create:courses'
  | 'read:courses'
  | 'update:courses'
  | 'delete:courses'
  | 'create:subjects'
  | 'read:subjects'
  | 'update:subjects'
  | 'delete:subjects'
  | 'create:grades'
  | 'read:grades'
  | 'update:grades'
  | 'delete:grades'
  | 'create:attendance'
  | 'read:attendance'
  | 'update:attendance'
  | 'delete:attendance'
  | 'create:reports'
  | 'read:reports'
  | 'update:reports'
  | 'delete:reports'
  | 'manage:establishment';

export interface RoleConfig {
  routes: string[];
  permissions: Permission[];
}

export const RolePermissions: Record<Role, RoleConfig> = {
  admin: {
    routes: [
      '/dashboard',
      '/dashboard/admin/users',
      '/dashboard/admin/students',
      '/dashboard/admin/teachers',
      '/dashboard/admin/courses',
      '/dashboard/admin/subjects',
      '/dashboard/admin/grades',
      '/dashboard/admin/attendance',
      '/dashboard/admin/reports',
      '/dashboard/admin/settings'
    ],
    permissions: [
      'create:users', 'read:users', 'update:users', 'delete:users',
      'create:students', 'read:students', 'update:students', 'delete:students',
      'create:teachers', 'read:teachers', 'update:teachers', 'delete:teachers',
      'create:courses', 'read:courses', 'update:courses', 'delete:courses',
      'create:subjects', 'read:subjects', 'update:subjects', 'delete:subjects',
      'create:grades', 'read:grades', 'update:grades', 'delete:grades',
      'create:attendance', 'read:attendance', 'update:attendance', 'delete:attendance',
      'create:reports', 'read:reports', 'update:reports', 'delete:reports',
      'manage:establishment'
    ]
  },
  directivo: {
    routes: [
      '/dashboard',
      '/dashboard/director/students',
      '/dashboard/director/teachers',
      '/dashboard/director/courses',
      '/dashboard/director/grades',
      '/dashboard/director/attendance',
      '/dashboard/director/reports'
    ],
    permissions: [
      'read:students',
      'read:teachers',
      'read:courses',
      'read:grades',
      'read:attendance',
      'create:reports',
      'read:reports'
    ]
  },
  docente: {
    routes: [
      '/dashboard',
      '/dashboard/teacher/students',
      '/dashboard/teacher/subjects',
      '/dashboard/teacher/grades',
      '/dashboard/teacher/attendance',
      '/dashboard/teacher/reports'
    ],
    permissions: [
      'read:students',
      'read:subjects',
      'create:grades', 'read:grades', 'update:grades',
      'create:attendance', 'read:attendance', 'update:attendance',
      'create:reports', 'read:reports'
    ]
  },
  apoyo: {
    routes: [
      '/dashboard',
      '/dashboard/support/students',
      '/dashboard/support/courses',
      '/dashboard/support/reports'
    ],
    permissions: [
      'read:students',
      'read:courses',
      'create:reports',
      'read:reports'
    ]
  },
  apoderado: {
    routes: [
      '/dashboard',
      '/dashboard/parent/children',
      '/dashboard/parent/grades',
      '/dashboard/parent/attendance',
      '/dashboard/parent/reports'
    ],
    permissions: [
      'read:grades',
      'read:attendance',
      'read:reports'
    ]
  },
  estudiante: {
    routes: [
      '/dashboard',
      '/dashboard/student/profile',
      '/dashboard/student/course',
      '/dashboard/student/subjects',
      '/dashboard/student/grades',
      '/dashboard/student/attendance'
    ],
    permissions: [
      'read:grades',
      'read:attendance'
    ]
  }
};