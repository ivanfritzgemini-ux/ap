
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
    { href: '/dashboard/calificaciones', label: 'Calificaciones', icon: ClipboardList },
    { href: '/dashboard/asistencia', label: 'Asistencia', icon: ClipboardCheck },
    { href: '#', label: 'Reportes', icon: BarChart2 },
  { href: '/dashboard/admin/establecimiento', label: 'Establecimiento', icon: Building },
    { href: '/dashboard/admin/parent-access', label: 'Acceso de Padres', icon: ShieldCheck },
    { href: '/dashboard/admin/view-users', label: 'Ver Usuarios DB', icon: Database },
  ],
    teacher: [
    { href: '/dashboard/asistencia', label: 'Asistencia', icon: ClipboardCheck },
    { href: '/dashboard/teacher/classes', label: 'Mis Clases', icon: Book },
    { href: '/dashboard/calificaciones', label: 'Calificaciones', icon: ClipboardList },
  ],
  parent: [
    { href: '/dashboard/parent/overview', label: 'Resumen del Niño', icon: User },
  ],
  student: [
    { href: '/dashboard/student/schedule', label: 'Mi Horario', icon: Calendar },
  ],
};

const getNavLinksForRole = (role: Role) => {
  const normalized = (role || '').toString().toLowerCase();
  // If administrator (accept english/spanish/variants), return every available nav item (from all groups) without duplicates
  if (normalized === 'administrator' || normalized === 'administrador' || normalized.includes('admin')) {
    const combined = [
      ...navItems.all,
      ...navItems.administrator,
      ...navItems.teacher,
      ...navItems.parent,
      ...navItems.student,
    ];
    const seen = new Set<string>();
    return combined.filter(item => {
      const key = item.href + '|' + item.label;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  switch (role) {
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
