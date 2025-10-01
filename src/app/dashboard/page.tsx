import { getStudentsByHeadTeacher } from "@/lib/data";
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
import { TeacherGenderDonut } from '@/components/dashboard/teacher-gender-donut'

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

  let estudiantesCursoJefe: any[] = [];
  if (cursoProfesorJefe) {
    estudiantesCursoJefe = await getStudentsByHeadTeacher(userId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
        <span className="text-sm text-muted-foreground">{role}</span>
        {cursoProfesorJefe && (
          <span className="text-sm text-blue-700 font-medium">
            Curso a cargo: {cursoProfesorJefe.nivel}º Medio {cursoProfesorJefe.letra}
          </span>
        )}
      </div>

      {cursoProfesorJefe && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alumnos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estudiantesCursoJefe.length}</div>
                <p className="text-xs text-muted-foreground">
                  Alumnos matriculados en el curso
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95.2%</div>
                <p className="text-xs text-muted-foreground">
                  Promedio del último mes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asistencia Perfecta</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">
                  Alumnos con 100% de asistencia
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Alumnos del Curso a Cargo</CardTitle>
                <CardDescription>Listado de alumnos actualmente matriculados en tu curso.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>N° Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiantesCursoJefe.map((est: any) => (
                      <TableRow key={est.id}>
                        <TableCell>{est.nombre_completo}</TableCell>
                        <TableCell>{est.email}</TableCell>
                        <TableCell>{est.nro_registro}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Sexo</CardTitle>
                <CardDescription>Porcentaje de estudiantes por sexo.</CardDescription>
              </CardHeader>
              <CardContent>
                <TeacherGenderDonut courseId={cursoProfesorJefe.id} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!cursoProfesorJefe && (
        <Card>
          <CardHeader>
            <CardTitle>No tienes cursos a cargo</CardTitle>
            <CardDescription>
              Actualmente no eres profesor jefe de ningún curso. Si crees que esto es un error, por favor contacta al administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
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