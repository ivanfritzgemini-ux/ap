import { Role } from '@/types/roles';
import { hasPermission } from '@/middleware/auth';

export interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    label: 'Panel',
    path: '/panel',
    icon: 'dashboard'
  },
  {
    label: 'Usuarios',
    path: '/usuarios',
    icon: 'users',
    permission: 'read:users'
  },
  {
    label: 'Estudiantes',
    path: '/estudiantes',
    icon: 'student',
    permission: 'read:students'
  },
  {
    label: 'Profesores',
    path: '/profesores',
    icon: 'teacher',
    permission: 'read:teachers'
  },
  {
    label: 'Cursos',
    path: '/cursos',
    icon: 'courses',
    permission: 'read:courses'
  },
  {
    label: 'Asignaturas',
    path: '/asignaturas',
    icon: 'subjects',
    permission: 'read:subjects'
  },
  {
    label: 'Calificaciones',
    path: '/calificaciones',
    icon: 'grades',
    permission: 'read:grades'
  },
  {
    label: 'Asistencia',
    path: '/asistencia',
    icon: 'attendance',
    permission: 'read:attendance'
  },
  {
    label: 'Reportes',
    path: '/reportes',
    icon: 'reports',
    permission: 'read:reports'
  },
  {
    label: 'Establecimiento',
    path: '/establecimiento',
    icon: 'settings',
    permission: 'manage:establishment'
  }
];