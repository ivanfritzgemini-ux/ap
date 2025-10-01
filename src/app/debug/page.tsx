import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DebugPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Obtener datos del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select(`
      nombres,
      apellidos,
      roles (
        nombre_rol
      )
    `)
    .eq('id', user.id)
    .single();

  // Procesar rol
  const rolesRaw = (userData as any)?.roles;
  let userRole: string = 'student';
  if (Array.isArray(rolesRaw)) {
    userRole = rolesRaw[0]?.nombre_rol ?? 'student';
  } else if (rolesRaw && typeof rolesRaw === 'object') {
    userRole = (rolesRaw as any).nombre_rol ?? 'student';
  }
  userRole = String(userRole ?? '').trim();

  // Normalizar rol
  const normalizeRole = (r: string) => {
    const s = (r || '').toString().toLowerCase().trim();
    if (s.includes('admin')) return 'administrator';
    if (s.includes('teacher') || s.includes('profesor') || s.includes('docente')) return 'teacher';
    if (s.includes('parent') || s.includes('padre') || s.includes('madre')) return 'parent';
    if (s.includes('student') || s.includes('estudiante') || s.includes('alumno')) return 'student';
    return s || 'student';
  }
  const normalizedRole = normalizeRole(userRole);

  // Simular la lógica del sidebar
  const getNavLinksForRole = (role: string) => {
    const normalized = (role || '').toString().toLowerCase();
    if (normalized === 'administrator' || normalized === 'administrador' || normalized.includes('admin')) {
      return 'TODOS LOS MENÚS (ADMIN)';
    }
    switch (normalized) {
      case 'teacher':
        return 'MENÚS DE TEACHER';
      case 'parent':
        return 'MENÚS DE PARENT';
      case 'student':
        return 'MENÚS DE STUDENT';
      default:
        return 'MENÚS POR DEFECTO';
    }
  }

  const sidebarResult = getNavLinksForRole(normalizedRole);

  // Verificar profesor jefe
  const { data: cursosProfesorJefe } = await supabase
    .from('cursos')
    .select('id, nombre_curso, nivel')
    .eq('profesor_jefe_id', user.id);

  const cursoProfesorJefe = cursosProfesorJefe?.[0] || null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug Dashboard + Sidebar</h1>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold">Usuario Actual</h2>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Nombre:</strong> {userData?.nombres} {userData?.apellidos}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold">Rol</h2>
          <p><strong>Rol original:</strong> "{userRole}"</p>
          <p><strong>Rol normalizado:</strong> "{normalizedRole}"</p>
          <p><strong>Es teacher?:</strong> {normalizedRole === 'teacher' ? 'Sí' : 'No'}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold">Sidebar Logic</h2>
          <p><strong>Rol pasado al sidebar:</strong> "{normalizedRole}"</p>
          <p><strong>Resultado del sidebar:</strong> {sidebarResult}</p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold">Resultado Esperado</h2>
          <p><strong>Dashboard:</strong> {normalizedRole === 'teacher' ? 'TeacherDashboard' : 'Otro'}</p>
          <p><strong>Sidebar:</strong> {sidebarResult === 'MENÚS DE TEACHER' ? 'Menús de profesor' : 'Menús incorrectos'}</p>
          <p><strong>Tarjeta curso:</strong> {cursoProfesorJefe ? 'Mostrar' : 'Ocultar'}</p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm">
          Si el "Resultado del sidebar" no es "MENÚS DE TEACHER", hay un problema en la lógica del sidebar.
          Si es correcto pero no ves los menús, el problema está en el componente SidebarNav.
        </p>
      </div>
    </div>
  );
}