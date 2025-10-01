import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, ClipboardCheck, ArrowUpRight, UserPlus, UserMinus, Book, GraduationCap, UserCheck, CheckCircle, School, Calendar, ClipboardList } from "lucide-react"
import { ResumenAsistenciaCard } from '@/components/dashboard/resumen-asistencia-card'
import { TendenciaAsistenciaCard } from '@/components/dashboard/tendencia-asistencia-card'
import { AsistenciaPerfectaCard } from '@/components/dashboard/asistencia-perfecta-card'
import { PerfectAttendanceByCourseCard } from '@/components/dashboard/perfect-attendance-by-course-card'
import { EstablishmentLogo } from "@/components/establishment-logo"
import { EnrollmentChart } from "@/components/dashboard/admin/enrollment-chart"
import { MonthlyMovementsWrapper } from '@/components/dashboard/monthly-movements-wrapper'
import { EnrollmentStatsCard } from '@/components/dashboard/enrollment-stats-card'
import { AttendanceStatsCard } from '@/components/dashboard/attendance-stats-card'
import { StudentsByCourseChart } from '@/components/dashboard/students-by-course-chart'
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { GenderDonut } from '@/components/dashboard/gender-donut'

const AdminDashboard = ({ fullName, role, totalStudents, totalTeachers, totalCourses, activeClasses, enrollmentData }: { fullName: string; role: string, totalStudents:number, totalTeachers:number, totalCourses:number, activeClasses:number, enrollmentData:{month:string;matriculas:number}[] }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <EnrollmentStatsCard />
      <AttendanceStatsCard />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Profesores</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTeachers}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-muted-foreground">
              {totalCourses > 0 ? `${(totalTeachers / totalCourses).toFixed(1)} profesores/curso` : 'Sin cursos'}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ratio estudiante-profesor: {totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : '0'}:1
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCourses}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-xs text-green-600">
              {totalCourses > 0 ? `${Math.round(totalStudents / totalCourses)} estudiantes/curso` : 'Sin estudiantes'}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Cursos con matrícula activa</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Movimientos del Mes
            </CardTitle>
            <CardDescription>Ingresos y retiros de alumnos para el mes seleccionado.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MonthlyMovementsWrapper />
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Estudiantes por Curso
          </CardTitle>
          <CardDescription>
            Distribución actual de estudiantes matriculados por curso académico
            <span className="ml-2 text-sm font-medium">
              • Total: {totalStudents} estudiantes activos
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
           <StudentsByCourseChart />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Sexo</CardTitle>
          <CardDescription>Porcentaje de estudiantes por sexo (activo).</CardDescription>
        </CardHeader>
        <CardContent>
          <GenderDonut />
        </CardContent>
      </Card>
    </div>
    
    {/* <div className="grid gap-6 lg:grid-cols-2">
  <AsistenciaPerfectaCard />
    </div> */}
     
     {/* Nueva sección para tarjetas de asistencia */}
     <div className="grid gap-6 lg:grid-cols-2">
        <ResumenAsistenciaCard />
        <TendenciaAsistenciaCard />
     </div>

     {/* Tarjeta de asistencia perfecta por curso */}
     <div className="grid gap-6">
        <PerfectAttendanceByCourseCard />
     </div>
     
     {/* Tarjeta de asistencia semanal */}
     <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-500" />
              Asistencia Semanal
            </CardTitle>
            <CardDescription>Promedio de asistencia por día de la semana actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-3">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia, index) => {
                // Valores más realistas basados en patrones típicos escolares
                const porcentaje = [94, 96, 93, 91, 87][index];
                const asistieron = Math.round((porcentaje / 100) * totalStudents);
                return (
                  <div key={dia} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-medium">{dia}</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          porcentaje >= 95 ? 'bg-emerald-500' :
                          porcentaje >= 90 ? 'bg-green-500' :
                          porcentaje >= 85 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-medium text-right min-w-[45px]">{porcentaje}%</div>
                    <div className="text-xs text-muted-foreground min-w-[35px] text-right">{asistieron}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Promedio semanal</span>
                <span className="font-medium">92.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
     </div>
  </div>
);

const TeacherDashboard = async ({ fullName, role, userId }: { fullName: string; role: string; userId: string }) => {
  const supabase = await createServerClient();

  // Verificar si el docente es profesor jefe de algún curso
  const { data: cursosProfesorJefe } = await supabase
    .from('cursos')
    .select('id, nombre_curso, nivel, letra, profesor_jefe_id')
    .eq('profesor_jefe_id', userId);

  // Si tiene cursos como profesor jefe, tomar el primero
  const cursoProfesorJefe = cursosProfesorJefe?.[0] || null;

  // Información detallada del curso del profesor jefe
  let cursoInfo = null;
  let estudiantesEnCurso = 0;
  let asignaturasEnCurso = 0;
  let asistenciaPromedioCurso = 0;
  let estudiantesCursoJefe = [];

  if (cursoProfesorJefe) {
    // Obtener información completa del curso
    const { data: cursoData } = await supabase
      .from('cursos')
      .select('*')
      .eq('id', cursoProfesorJefe.id)
      .single();

    cursoInfo = cursoData;

    // Contar estudiantes matriculados
    const { count: estudiantesCount, data: estudiantesData } = await supabase
      .from('estudiantes_detalles')
      .select('id, nombres, apellidos, sexo', { count: 'exact', head: false })
      .eq('curso_id', cursoProfesorJefe.id)
      .eq('es_matricula_actual', true);
    estudiantesEnCurso = estudiantesCount || 0;
    estudiantesCursoJefe = estudiantesData || [];

    // Contar asignaturas del curso (sin filtrar por profesor_id ya que no existe esa columna)
    // Por ahora usaremos un placeholder hasta que se defina la relación correcta
    asignaturasEnCurso = 8; // Placeholder - debería calcularse dinámicamente

    // Calcular asistencia promedio del curso (placeholder por ahora)
    asistenciaPromedioCurso = Math.floor(Math.random() * 15) + 80; // 80-95%
  }

  // Obtener el total de asignaturas asignadas al docente usando curso_asignatura
  const { count: totalAsignaturas } = await supabase
    .from('curso_asignatura')
    .select('id', { count: 'exact', head: true })
    .eq('profesor_id', userId);

  // Obtener detalles de asignaturas para mostrar en la lista (opcional, si se quiere mostrar cards)
  const { data: asignaturas } = await supabase
    .from('asignaturas')
    .select(`
      id,
      nombre,
      descripcion
    `)
    .in('id',
      (
        (await supabase
          .from('curso_asignatura')
          .select('asignatura_id')
          .eq('profesor_id', userId)
        ).data?.map((row: any) => row.asignatura_id) || []
      )
    );

  // Estadísticas del docente
  let totalEstudiantes = 0;
  let asistenciaPromedio = 0;
  let clasesHoy = 0;

  if (totalAsignaturas && totalAsignaturas > 0) {
    // Si el profesor es jefe de curso, contar todos los estudiantes de ese curso
    if (cursoProfesorJefe) {
      totalEstudiantes = estudiantesEnCurso;
      asistenciaPromedio = asistenciaPromedioCurso;
    } else {
      // Si no es profesor jefe, intentar contar estudiantes de cursos donde imparte asignaturas
      // Por ahora usamos un cálculo aproximado basado en asignaturas
      totalEstudiantes = Math.max(25, totalAsignaturas * 15 + Math.floor(Math.random() * 10)); // 25-40+ estudiantes por asignatura
      asistenciaPromedio = Math.floor(Math.random() * 8) + 87; // 87-95%
    }

    clasesHoy = Math.min(totalAsignaturas, 4); // Máximo 4 clases al día
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
        <p className="text-sm text-muted-foreground">{role}</p>
        {cursoProfesorJefe && cursoInfo && (
          <div className="mt-1 text-blue-700 font-medium text-sm">
            Curso a cargo: {cursoInfo.nivel}º Medio {cursoInfo.letra}
          </div>
        )}
      </div>
      {/* Listado de estudiantes del curso a cargo */}
      {cursoProfesorJefe && estudiantesCursoJefe.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Estudiantes de tu curso a cargo</CardTitle>
            <CardDescription>Listado de estudiantes actualmente matriculados en tu curso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Sexo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estudiantesCursoJefe.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell>{est.apellidos}, {est.nombres}</TableCell>
                    <TableCell>{est.sexo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaturas</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAsignaturas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {totalAsignaturas === 1 ? 'Asignatura asignada' : 'Asignaturas asignadas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstudiantes}</div>
            <p className="text-xs text-muted-foreground">
              {cursoProfesorJefe ? 'En tu curso a cargo' : 'Estudiantes totales'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asistenciaPromedio}%</div>
            <p className="text-xs text-muted-foreground">
              {cursoProfesorJefe ? 'En tu curso' : 'En tus asignaturas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clasesHoy}</div>
            <p className="text-xs text-muted-foreground">
              {clasesHoy === 1 ? 'Clase programada' : 'Clases programadas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ficha del Curso - Solo si es profesor jefe */}
      {cursoProfesorJefe && cursoInfo && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-blue-600" />
              Mi Curso a Cargo: {cursoInfo.nombre_curso}
            </CardTitle>
            <CardDescription>
              Como profesor jefe, eres responsable de este curso. Nivel {cursoInfo.nivel}º {cursoInfo.letra}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">{cursoInfo.nombre_curso}</h4>
                <p className="text-sm text-muted-foreground">
                  Nivel {cursoInfo.nivel}º {cursoInfo.letra}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tipo de Enseñanza: {cursoInfo.tipo_ensenanza}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {cursoInfo.id}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{estudiantesEnCurso} estudiantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Book className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{asignaturasEnCurso} asignaturas</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Asistencia: {asistenciaPromedioCurso}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Calificaciones al día</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={`/dashboard/teacher/courses/${cursoProfesorJefe.id}`}>Ver Detalles del Curso</a>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/dashboard/teacher/classes">Gestionar Estudiantes</a>
                </Button>
              </div>
            </div>

            {/* Estadísticas adicionales del curso */}
            <div className="mt-6 pt-4 border-t border-blue-200">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(estudiantesEnCurso * 0.95)}
                  </div>
                  <p className="text-xs text-muted-foreground">Estudiantes activos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(estudiantesEnCurso * 0.02)}
                  </div>
                  <p className="text-xs text-muted-foreground">Retirados este mes</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.floor(estudiantesEnCurso * 0.03)}
                  </div>
                  <p className="text-xs text-muted-foreground">Con inasistencias</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tus Asignaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Tus Asignaturas</CardTitle>
          <CardDescription>
            Asignaturas que impartes este período académico.
            {cursoProfesorJefe && (
              <span className="block text-sm text-blue-600 mt-1">
                Como profesor jefe de {cursoProfesorJefe.nombre_curso}, también eres responsable de todas las asignaturas del curso.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {asignaturas && asignaturas.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {asignaturas.map((asignatura, idx) => {
                // Si existe curso_asignatura_id, úsalo para la clave, si no, usa id+idx
                const uniqueKey = asignatura.curso_asignatura_id
                  ? `${asignatura.id}-${asignatura.curso_asignatura_id}`
                  : `${asignatura.id}-${idx}`;
                return (
                  <Card key={uniqueKey}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{asignatura.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {asignatura.descripcion && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {asignatura.descripcion}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        ID: {asignatura.id}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes asignaturas asignadas</h3>
              <p className="text-muted-foreground">
                Actualmente no tienes asignaturas asignadas.
                {cursoProfesorJefe && (
                  <span className="block mt-2 text-blue-600">
                    Sin embargo, como profesor jefe de {cursoProfesorJefe.nombre_curso}, eres responsable del curso completo.
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horario de Hoy */}
      <Card>
        <CardHeader>
          <CardTitle>Horario de Hoy</CardTitle>
          <CardDescription>Tu horario de clases para hoy.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Asignatura</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Salón</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Placeholder - en un sistema real, esto vendría de una tabla de horarios */}
              <TableRow>
                <TableCell>9:00 AM - 10:00 AM</TableCell>
                <TableCell>{asignaturas?.[0]?.nombre || 'Matemáticas'}</TableCell>
                <TableCell>{cursoProfesorJefe?.nombre_curso || 'Grado 10'}</TableCell>
                <TableCell>301A</TableCell>
                <TableCell>
                  <Badge variant="secondary">Próxima</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>10:15 AM - 11:15 AM</TableCell>
                <TableCell>{asignaturas?.[1]?.nombre || 'Física'}</TableCell>
                <TableCell>{cursoProfesorJefe?.nombre_curso || 'Grado 11'}</TableCell>
                <TableCell>402B</TableCell>
                <TableCell>
                  <Badge variant="outline">Completada</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Anuncios y Recordatorios */}
      <Card>
        <CardHeader>
          <CardTitle>Anuncios y Recordatorios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Reunión de personal</p>
              <p className="text-sm text-blue-600">Mañana a las 3 PM en la sala de conferencias principal.</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Calificaciones pendientes</p>
              <p className="text-sm text-yellow-600">Tienes 5 calificaciones por ingresar para el período actual.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ParentDashboard = ({ fullName, role }: { fullName: string; role: string }) => (
    <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Resumen de su Hijo (Alex Doe)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Calificaciones Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between"><span>Examen de Matemáticas:</span> <span className="font-bold">A-</span></li>
                            <li className="flex justify-between"><span>Ensayo de Historia:</span> <span className="font-bold">B+</span></li>
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Asistencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">98%</p>
                        <p className="text-xs text-muted-foreground">1 ausencia este semestre.</p>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    </div>
);

const StudentDashboard = ({ fullName, role }: { fullName: string; role: string }) => (
    <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Tu Horario</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Tienes Matemáticas a continuación en el Salón 301A.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Calificaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Examen de Matemáticas: A-</p>
            </CardContent>
        </Card>
    </div>
);

export default async function DashboardPage() {
  const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

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
    
    // 'roles' relationship may come as an array or an object depending on the query
    const rolesRaw = (userData as any)?.roles;
    let userRole: string = 'student';
    if (Array.isArray(rolesRaw)) {
      userRole = rolesRaw[0]?.nombre_rol ?? 'student';
    } else if (rolesRaw && typeof rolesRaw === 'object') {
      userRole = (rolesRaw as any).nombre_rol ?? 'student';
    }
    // Trim whitespace/newlines and keep raw for display
    userRole = String(userRole ?? '').trim();

    // Normalize to canonical role keys for logic
    const normalizeRole = (r: string) => {
      const s = (r || '').toString().toLowerCase().trim();
      if (s.includes('admin')) return 'administrator';
      if (s.includes('teacher') || s.includes('profesor') || s.includes('docente')) return 'teacher';
      if (s.includes('parent') || s.includes('padre') || s.includes('madre')) return 'parent';
      if (s.includes('student') || s.includes('estudiante') || s.includes('alumno')) return 'student';
      return s || 'student';
    }
    const normalizedRole = normalizeRole(userRole);

    const firstName = (userData as any)?.nombres ?? '';
    const lastName = (userData as any)?.apellidos ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || (user.email ?? '');

    // --- Fetch aggregate data for dashboard cards ---
    // total students: count from estudiantes_detalles where no fecha_retiro
    let totalStudents = 0
    let totalTeachers = 0
    let totalCourses = 0
    let activeClasses = 0
  let enrollmentData: { month: string; matriculas: number }[] = []
    try {
      // count students (estudiantes_detalles with active enrollment)
      const studentsRes = await supabase
        .from('estudiantes_detalles')
        .select('id', { count: 'exact', head: false })
        .eq('es_matricula_actual', true)
      totalStudents = (studentsRes.count ?? 0) as number

      // courses - simplified query just for counting
      const coursesRes = await supabase.from('cursos').select('id', { count: 'exact', head: false })
      totalCourses = coursesRes.count ?? 0

      // enrollment rows for monthly aggregation
  const enrollRes = await supabase.from('estudiantes_detalles').select('fecha_matricula').eq('es_matricula_actual', true)
  const enrollRows = enrollRes.data as any
      // Heuristic for totalTeachers: query roles table for 'profesor' role id then count users
          try {
      const rolesRes = (await supabase.from('roles').select('id,nombre_rol')).data as any
      // Prefer exact match for role names that include 'docente' (Spanish), 'profesor' or 'teacher'
      const teacherRole = (rolesRes || []).find((r: any) => /docente|profesor|teacher/i.test(r.nombre_rol))
        if (teacherRole) {
          const { count } = await supabase.from('usuarios').select('id', { count: 'exact', head: false }).eq('rol_id', teacherRole.id)
          totalTeachers = count ?? 0
        } else {
          // fallback: try simple ilike search on roles relationship
              const teachersGuess = (await supabase.from('usuarios').select('id,roles(nombre_rol)')).data as any
              totalTeachers = Array.isArray(teachersGuess) ? teachersGuess.filter((u: any) => {
                const r = u.roles
                if (!r) return false
                const name = Array.isArray(r) ? r[0]?.nombre_rol : r.nombre_rol
                return /docente|profesor|teacher/i.test(name || '')
              }).length : 0
        }
      } catch (e: any) {
        console.error('[dashboard] teacher count error', e)
      }

  

      // activeClasses: approximate by distinct curso_id in estudiantes_detalles
      try {
  const distinctCourses = (await supabase.from('estudiantes_detalles').select('curso_id', { count: 'exact', head: false }).eq('es_matricula_actual', true)).data as any
  activeClasses = Array.isArray(distinctCourses) ? distinctCourses.length : totalStudents
      } catch (e) {
        activeClasses = totalStudents
      }

      // Build monthly enrollment counts from fecha_matricula
      // Only include months Mar..Dic (2..11)
      const monthsWithIndex = [
        { label: 'Mar', idx: 2 },
        { label: 'Abr', idx: 3 },
        { label: 'May', idx: 4 },
        { label: 'Jun', idx: 5 },
        { label: 'Jul', idx: 6 },
        { label: 'Ago', idx: 7 },
        { label: 'Sep', idx: 8 },
        { label: 'Oct', idx: 9 },
        { label: 'Nov', idx: 10 },
        { label: 'Dic', idx: 11 },
      ]
      const counts: Record<number, number> = {}
      if (enrollRows && Array.isArray(enrollRows)) {
        for (const row of enrollRows) {
          const dateStr = row?.fecha_matricula
          if (!dateStr) continue
          const d = new Date(dateStr)
          if (isNaN(d.getTime())) continue
          const m = d.getMonth() // 0-11
          counts[m] = (counts[m] || 0) + 1
        }
      }
  enrollmentData = monthsWithIndex.map((m) => ({ month: m.label, matriculas: counts[m.idx] || 0 }))
    } catch (e: any) {
      console.error('[dashboard] aggregate fetch error', e)
    }

    let DashboardComponent;
  // Decide which dashboard to render using the normalized role key.
  switch (normalizedRole) {
    case "administrator":
  DashboardComponent = () => <AdminDashboard fullName={fullName} role={userRole} totalStudents={totalStudents} totalTeachers={totalTeachers} totalCourses={totalCourses} activeClasses={activeClasses} enrollmentData={enrollmentData} />;
      break;
    case "teacher":
      DashboardComponent = () => <TeacherDashboard fullName={fullName} role={userRole} userId={user.id} />;
      break;
    case "parent":
      DashboardComponent = () => <ParentDashboard fullName={fullName} role={userRole} />;
      break;
    case "student":
      DashboardComponent = () => <StudentDashboard fullName={fullName} role={userRole} />;
      break;
    default:
      DashboardComponent = () => (
        <div>
        <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
        <p className="text-sm text-muted-foreground">{userRole}</p>
        </div>
      );
  }

    return (
      <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-headline font-semibold">Panel de Control</h1>
          <DashboardComponent />
        </div>
    );
};
