import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getTeacherCourses, getTeacherGrades, type TeacherCourse, type StudentGrade } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradesManagement } from '@/components/dashboard/teacher/grades-management';
import { GraduationCap, Users, BookOpen, Award } from 'lucide-react';

interface TeacherGradesPageProps {
  searchParams: {
    course?: string;
    subject?: string;
  };
}

export default async function TeacherGradesPage({ searchParams }: TeacherGradesPageProps) {
  const supabase = await createServerClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Verificar rol de profesor
  const { data: profile } = await supabase
    .from('usuarios')
    .select('rol:rol_id(nombre_rol)')
    .eq('id', user.id)
    .single();

  const userRole = Array.isArray(profile?.rol) ? (profile.rol[0] as any)?.nombre_rol : (profile?.rol as any)?.nombre_rol;
  const normalizedRole = userRole?.toLowerCase() === 'docente' ? 'teacher' : userRole;

  if (normalizedRole !== 'teacher') {
    redirect('/dashboard');
  }

  console.log("📚 TeacherGradesPage: Obteniendo cursos del profesor...");

  // Obtener cursos donde puede calificar
  const courses = await getTeacherCourses();

  console.log("📚 TeacherGradesPage: Cursos obtenidos:", courses.length);
  console.log("📚 TeacherGradesPage: Primeros 3 cursos:", courses.slice(0, 3).map((c: TeacherCourse) => ({ 
    nombre: c.nombre_curso, 
    esJefe: c.es_profesor_jefe, 
    asignaturas: c.asignaturas.length,
    estudiantes: c.estudiantes_activos 
  })));

  // Si hay un curso seleccionado, obtener las calificaciones
  let selectedCourse: TeacherCourse | undefined = undefined;
  let grades: StudentGrade[] = [];

  if (searchParams.course) {
    selectedCourse = courses.find((c: TeacherCourse) => c.id === searchParams.course);
    if (selectedCourse) {
      grades = await getTeacherGrades(searchParams.course, searchParams.subject);
    }
  }

  // Calcular estadísticas
  const totalCourses = courses.length;
  const totalAsJefe = courses.filter((c: TeacherCourse) => c.es_profesor_jefe).length;
  const totalAsProfesor = courses.filter((c: TeacherCourse) => !c.es_profesor_jefe).length;
  const totalStudents = courses.reduce((sum: number, c: TeacherCourse) => sum + c.estudiantes_activos, 0);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calificaciones</h1>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Cursos donde puede calificar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Como Profesor Jefe</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAsJefe}</div>
            <p className="text-xs text-muted-foreground">
              Cursos bajo su jefatura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Como Profesor de Asignatura</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAsProfesor}</div>
            <p className="text-xs text-muted-foreground">
              Cursos donde imparte materias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Estudiantes activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Componente principal de gestión de calificaciones */}
      <GradesManagement 
        courses={courses}
        selectedCourseId={searchParams.course}
        selectedSubjectId={searchParams.subject}
        initialGrades={grades}
      />
    </div>
  );
}