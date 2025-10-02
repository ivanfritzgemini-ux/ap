
"use client";
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ShieldCheck,
  Calendar,
  User,
  GraduationCap,
  Briefcase,
  Book,
  ClipboardList,
  BarChart2,
  Building,
  Database,
  BookOpen,
  School
} from "lucide-react";
import type { Role } from '@/types/roles';

interface SidebarNavProps {
  userRole: Role;
}

const navItems = {
  all: [
    { href: '/dashboard', label: 'Panel de Control', icon: LayoutDashboard },
  ],
  administrator: [
    { href: '/dashboard/admin/users', label: 'Gestión de Usuarios', icon: Users },
    { href: '/dashboard/admin/students', label: 'Estudiantes', icon: GraduationCap },
    { href: '/dashboard/admin/teachers', label: 'Profesores', icon: Briefcase },
    { href: '/dashboard/admin/courses', label: 'Cursos', icon: School },
    { href: '/dashboard/admin/subjects', label: 'Asignaturas', icon: Book },
    { href: '/dashboard/admin/grades', label: 'Calificaciones', icon: ClipboardList },
    { href: '/dashboard/admin/attendance', label: 'Asistencia', icon: ClipboardCheck },
    { href: '/dashboard/admin/reports', label: 'Reportes', icon: BarChart2 },
    { href: '/dashboard/admin/settings', label: 'Establecimiento', icon: Building },
  ],
  directivo: [
    { href: '/dashboard/director/students', label: 'Estudiantes', icon: GraduationCap },
    { href: '/dashboard/director/teachers', label: 'Profesores', icon: Briefcase },
    { href: '/dashboard/director/courses', label: 'Cursos', icon: School },
    { href: '/dashboard/director/grades', label: 'Calificaciones', icon: ClipboardList },
    { href: '/dashboard/director/attendance', label: 'Asistencia', icon: ClipboardCheck },
    { href: '/dashboard/director/reports', label: 'Reportes', icon: BarChart2 },
  ],
  docente: [
    { href: '/dashboard/teacher/students', label: 'Mis Estudiantes', icon: GraduationCap },
    { href: '/dashboard/teacher/subjects', label: 'Mis Asignaturas', icon: Book },
    { href: '/dashboard/teacher/grades', label: 'Calificaciones', icon: ClipboardList },
    { href: '/dashboard/teacher/attendance', label: 'Asistencia', icon: ClipboardCheck },
    { href: '/dashboard/teacher/reports', label: 'Reportes', icon: BarChart2 },
  ],
  apoderado: [
    { href: '/dashboard/parent/children', label: 'Mis Hijos', icon: GraduationCap },
    { href: '/dashboard/parent/grades', label: 'Calificaciones', icon: ClipboardList },
    { href: '/dashboard/parent/attendance', label: 'Asistencia', icon: ClipboardCheck },
    { href: '/dashboard/parent/reports', label: 'Reportes', icon: BarChart2 },
  ],
  estudiante: [
    { href: '/dashboard/student/profile', label: 'Mi Perfil', icon: User },
    { href: '/dashboard/student/course', label: 'Mi Curso', icon: School },
    { href: '/dashboard/student/subjects', label: 'Mis Asignaturas', icon: Book },
    { href: '/dashboard/student/grades', label: 'Calificaciones', icon: ClipboardList },
    { href: '/dashboard/student/attendance', label: 'Asistencia', icon: ClipboardCheck },
  ],
};

const getNavLinksForRole = (role: Role) => {
  const normalized = (role || '').toString().toLowerCase();
  
  switch (normalized) {
    case 'admin':
    case 'administrator':
    case 'administrador':
      return [...navItems.all, ...navItems.administrator];
    case 'directivo':
    case 'director':
      return [...navItems.all, ...navItems.administrator.filter(item => 
        !item.href.includes('usuarios') && !item.href.includes('establecimiento')
      )];
    case 'docente':
    case 'profesor':
    case 'teacher':
      return [...navItems.all, ...navItems.docente];
    case 'apoyo':
    case 'support':
      return [...navItems.all, ...navItems.apoderado];
    case 'apoderado':
    case 'parent':
    case 'guardian':
      return [...navItems.all, ...navItems.apoderado];
    case 'estudiante':
    case 'student':
      return [...navItems.all, ...navItems.estudiante];
    default:
      return navItems.all;
  }
}

export function SidebarNav({ userRole }: SidebarNavProps) {
  const pathname = usePathname();
  const links = getNavLinksForRole(userRole);

  return (
    <div className="flex-1 overflow-auto">
      <SidebarMenu className="p-2">
        {links.map((item) => (
          <SidebarMenuItem key={item.href + item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
                <a href={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 md:h-5 lg:h-6 w-auto text-muted-foreground" />
                  <span>{item.label}</span>
                </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
