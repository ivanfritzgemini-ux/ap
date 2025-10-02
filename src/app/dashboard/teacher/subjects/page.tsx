import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTeacherSubjects } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubjectList } from "@/components/dashboard/teacher/subject-list";
import { Book, Users, GraduationCap, Clock } from "lucide-react";

export const metadata = {
  title: "Mis Asignaturas | Dashboard Profesor",
  description: "Gestiona las asignaturas que impartes",
};

export default async function TeacherSubjectsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Verificar que el usuario sea profesor
  const { data: userData } = await supabase
    .from('usuarios')
    .select(`
      roles (
        nombre_rol
      )
    `)
    .eq('id', user.id)
    .single();
    
  const rolesRaw = (userData as any)?.roles;
  let userRole: string = 'student';
  if (Array.isArray(rolesRaw)) {
    userRole = rolesRaw[0]?.nombre_rol ?? 'student';
  } else if (rolesRaw && typeof rolesRaw === 'object') {
    userRole = (rolesRaw as any).nombre_rol ?? 'student';
  }
  
  const normalizedRole = userRole.toLowerCase().trim();
  if (!normalizedRole.includes('docente') && !normalizedRole.includes('profesor')) {
    return redirect('/dashboard');
  }

  const subjects = await getTeacherSubjects();

  console.log("📚 TeacherSubjectsPage: Asignaturas obtenidas:", subjects.length);
  if (subjects.length > 0) {
    console.log("📚 TeacherSubjectsPage: Primeras 3 asignaturas:", subjects.slice(0, 3).map(s => ({
      nombre: s.nombre,
      cursos: s.cursos.length,
      estudiantes: s.total_estudiantes
    })));
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Book className="h-6 w-6 text-blue-500" />
          Mis Asignaturas
        </h1>
        <p className="text-muted-foreground">
          Gestiona las asignaturas que impartes y revisa la información de tus cursos
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asignaturas</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Materias que impartes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.reduce((total, subject) => total + subject.cursos.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cursos donde enseñas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subjects.reduce((total, subject) => total + subject.total_estudiantes, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estudiantes en tus asignaturas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de asignaturas con filtros y búsqueda */}
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Book className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay asignaturas asignadas</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No se encontraron asignaturas asignadas a tu perfil. Contacta al administrador si esto es un error.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SubjectList subjects={subjects} />
      )}

      {/* Acciones rápidas */}
      {subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a funciones relacionadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <a 
                href="/dashboard/teacher/students" 
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium">Ver Estudiantes</span>
              </a>
              <a 
                href="/dashboard/asistencia" 
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <Clock className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm font-medium">Tomar Asistencia</span>
              </a>
              <a 
                href="/dashboard/calificaciones" 
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <Book className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium">Calificaciones</span>
              </a>
              <a 
                href="/dashboard" 
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <GraduationCap className="h-8 w-8 text-orange-500 mb-2" />
                <span className="text-sm font-medium">Dashboard</span>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}