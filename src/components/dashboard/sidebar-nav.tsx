
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
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  Briefcase,
  Book,
  ClipboardList,
  BarChart2,
  Building,
  Database
} from "lucide-react";
import type { Role } from '@/lib/types';

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
    { href: '/dashboard/admin/courses', label: 'Cursos', icon: Book },
    { href: '#', label: 'Calificaciones', icon: ClipboardList },
    { href: '#', label: 'Asistencia', icon: ClipboardCheck },
    { href: '#', label: 'Reportes', icon: BarChart2 },
    { href: '#', label: 'Establecimiento', icon: Building },
    { href: '/dashboard/admin/parent-access', label: 'Acceso de Padres', icon: ShieldCheck },
    { href: '/dashboard/admin/view-users', label: 'Ver Usuarios DB', icon: Database },
  ],
  teacher: [
    { href: '/dashboard/teacher/attendance', label: 'Asistencia', icon: ClipboardCheck },
    { href: '/dashboard/teacher/classes', label: 'Mis Clases', icon: BookOpen },
  ],
  parent: [
    { href: '/dashboard/parent/overview', label: 'Resumen del Niño', icon: User },
  ],
  student: [
    { href: '/dashboard/student/schedule', label: 'Mi Horario', icon: Calendar },
  ],
};

const getNavLinksForRole = (role: Role) => {
    switch (role) {
        case 'administrator':
            return [...navItems.all, ...navItems.administrator];
        case 'teacher':
            return [...navItems.all, ...navItems.teacher];
        case 'parent':
            return [...navItems.all, ...navItems.parent];
        case 'student':
            return [...navItems.all, ...navItems.student];
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
              <a href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
}
