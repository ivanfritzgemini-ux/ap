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
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  UserCheck, 
  TrendingUp, 
  ClipboardCheck,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Calendar,
  Activity,
  DollarSign,
  School,
  Book,
  Briefcase
} from "lucide-react";
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
import { getTeacherDashboardData } from "@/lib/data"

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

const TeacherDashboard = ({ fullName, role, dashboardData }: { 
  fullName: string; 
  role: string; 
  dashboardData: any 
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>

    {/* Cards principales */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cursos a Cargo</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.totalCourses || 0}</div>
          <p className="text-xs text-muted-foreground">
            Como profesor jefe
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.totalActiveStudents || 0}</div>
          <p className="text-xs text-muted-foreground">
            {dashboardData?.totalWithdrawnStudents || 0} retirados este año
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asignaturas</CardTitle>
          <Book className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.totalSubjects || 0}</div>
          <p className="text-xs text-muted-foreground">
            Materias que imparte
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardData?.attendanceStats?.weeklyAverage?.toFixed(1) || '0'}%</div>
          <p className="text-xs text-muted-foreground">
            Esta semana
          </p>
        </CardContent>
      </Card>
    </div>

    {/* Cursos */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-500" />
          Mis Cursos
        </CardTitle>
        <CardDescription>
          Cursos donde ejerces como profesor jefe
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dashboardData?.courses && dashboardData.courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData.courses.map((curso: any) => {
              const tipoEducacion = Array.isArray(curso.tipo_educacion) 
                ? curso.tipo_educacion[0]?.nombre 
                : curso.tipo_educacion?.nombre;
              
              let nombreCurso = '';
              if (tipoEducacion?.toLowerCase().includes('enseñanza media técnico')) {
                nombreCurso = `${curso.nivel}º Medio TP ${curso.letra}`;
              } else if (tipoEducacion?.toLowerCase().includes('educación media')) {
                nombreCurso = `${curso.nivel}º Medio ${curso.letra}`;
              } else {
                nombreCurso = `${curso.nivel} ${curso.letra}`;
              }

              return (
                <Card key={curso.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{nombreCurso}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Estudiantes activos:</span>
                      <span className="font-medium">
                        {Math.round((dashboardData?.totalActiveStudents || 0) / dashboardData.courses.length)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Asistencia promedio:</span>
                      <span className="font-medium text-green-600">
                        {(dashboardData?.attendanceStats?.weeklyAverage || 0).toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">No tienes cursos asignados como profesor jefe.</p>
        )}
      </CardContent>
    </Card>

    {/* Distribución por género y asistencia semanal */}
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Género</CardTitle>
          <CardDescription>Estudiantes de tus cursos por género</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Masculino</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="h-2 bg-blue-500 rounded-full"
                    style={{
                      width: `${dashboardData?.totalActiveStudents > 0 
                        ? (dashboardData.genderStats.masculino / dashboardData.totalActiveStudents) * 100 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-8">{dashboardData?.genderStats?.masculino || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Femenino</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="h-2 bg-pink-500 rounded-full"
                    style={{
                      width: `${dashboardData?.totalActiveStudents > 0 
                        ? (dashboardData.genderStats.femenino / dashboardData.totalActiveStudents) * 100 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-8">{dashboardData?.genderStats?.femenino || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-500" />
            Asistencia Semanal
          </CardTitle>
          <CardDescription>Promedio de asistencia por día de la semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            {dashboardData?.attendanceStats?.latestAttendance?.map((dia: any, index: number) => (
              <div key={dia.day} className="flex items-center gap-3">
                <div className="w-16 text-xs font-medium">{dia.day}</div>
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      dia.percentage >= 95 ? 'bg-emerald-500' :
                      dia.percentage >= 90 ? 'bg-green-500' :
                      dia.percentage >= 85 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${dia.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs font-medium text-right min-w-[45px]">{dia.percentage}%</div>
                <div className="text-xs text-muted-foreground min-w-[35px] text-right">{dia.present}</div>
              </div>
            )) || (
              <p className="text-muted-foreground text-sm">No hay datos de asistencia disponibles</p>
            )}
          </div>
          {dashboardData?.attendanceStats && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Promedio semanal</span>
                <span className="font-medium">{dashboardData.attendanceStats.weeklyAverage.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Acciones rápidas */}
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
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
            href="/dashboard/teacher/subjects" 
            className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <Book className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Mis Asignaturas</span>
          </a>
          <a 
            href="/dashboard/asistencia" 
            className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <ClipboardCheck className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-sm font-medium">Tomar Asistencia</span>
          </a>
          <a 
            href="/dashboard/reports" 
            className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowUpRight className="h-8 w-8 text-orange-500 mb-2" />
            <span className="text-sm font-medium">Reportes</span>
          </a>
        </div>
      </CardContent>
    </Card>
  </div>
);

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

    // --- Fetch role-specific dashboard data ---
    let dashboardData: any = null;
    
    switch (normalizedRole) {
      case "teacher":
        dashboardData = await getTeacherDashboardData(user.id);
        break;
      default:
        // Other roles don't need specific dashboard data yet
        break;
    }

    let DashboardComponent;
  // Decide which dashboard to render using the normalized role key.
  switch (normalizedRole) {
    case "administrator":
  DashboardComponent = () => <AdminDashboard fullName={fullName} role={userRole} totalStudents={totalStudents} totalTeachers={totalTeachers} totalCourses={totalCourses} activeClasses={activeClasses} enrollmentData={enrollmentData} />;
      break;
    case "teacher":
      DashboardComponent = () => <TeacherDashboard fullName={fullName} role={userRole} dashboardData={dashboardData} />;
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
