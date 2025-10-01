import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type UserRole = 'administrator' | 'teacher' | 'parent' | 'student'

export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createServerClient();

  const { data: userData } = await supabase
    .from('usuarios')
    .select(`
      roles (
        nombre_rol
      )
    `)
    .eq('id', userId)
    .single();

  const rolesRaw = (userData as any)?.roles;
  let userRole: string = 'student';
  if (Array.isArray(rolesRaw)) {
    userRole = rolesRaw[0]?.nombre_rol ?? 'student';
  } else if (rolesRaw && typeof rolesRaw === 'object') {
    userRole = (rolesRaw as any).nombre_rol ?? 'student';
  }
  userRole = String(userRole ?? '').trim();

  // Normalizar rol
  const normalizeRole = (r: string): UserRole => {
    const s = (r || '').toString().toLowerCase().trim();
    if (s.includes('admin')) return 'administrator';
    if (s.includes('teacher') || s.includes('profesor') || s.includes('docente')) return 'teacher';
    if (s.includes('parent') || s.includes('padre') || s.includes('madre')) return 'parent';
    if (s.includes('student') || s.includes('estudiante') || s.includes('alumno')) return 'student';
    return 'student';
  };

  return normalizeRole(userRole);
}

export async function requireRole(requiredRole: UserRole, redirectTo: string = '/dashboard') {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userRole = await getUserRole(user.id);

  if (userRole !== requiredRole) {
    redirect(redirectTo);
  }

  return { user, userRole };
}

export async function requireAdmin(redirectTo: string = '/dashboard') {
  return requireRole('administrator', redirectTo);
}

export async function requireTeacher(redirectTo: string = '/dashboard') {
  return requireRole('teacher', redirectTo);
}