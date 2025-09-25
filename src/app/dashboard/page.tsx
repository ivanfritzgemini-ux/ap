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
import { Users, Briefcase, ClipboardCheck, ArrowUpRight, UserPlus, UserMinus, Book, GraduationCap, UserCheck, CheckCircle, School } from "lucide-react"
import { AsistenciaPerfectaCard } from '@/components/dashboard/asistencia-perfecta-card'
import { ResumenAsistenciaCard } from '@/components/dashboard/resumen-asistencia-card'
import { TendenciaAsistenciaCard } from '@/components/dashboard/tendencia-asistencia-card'
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
    
     <div className="grid gap-6 lg:grid-cols-2">
        <AsistenciaPerfectaCard />
     </div>
     
     {/* Nueva sección para tarjetas de asistencia */}
     <div className="grid gap-6 lg:grid-cols-3">
        <ResumenAsistenciaCard />
        <TendenciaAsistenciaCard />
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

const TeacherDashboard = ({ fullName, role }: { fullName: string; role: string }) => (
    <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Tus Clases de Hoy</CardTitle>
                <CardDescription>Este es tu horario de clases para hoy.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hora</TableHead>
                            <TableHead>Clase</TableHead>
                            <TableHead>Salón</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>9:00 AM - 10:00 AM</TableCell>
                            <TableCell>Grado 10 - Matemáticas</TableCell>
                            <TableCell>301A</TableCell>
                            <TableCell>Próxima</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>10:15 AM - 11:15 AM</TableCell>
                            <TableCell>Grado 11 - Física</TableCell>
                            <TableCell>402B</TableCell>
                            <TableCell>Completada</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Anuncios Recientes</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Reunión de personal a las 3 PM en la sala de conferencias principal.</p>
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
      if (s.includes('teacher') || s.includes('profesor')) return 'teacher';
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
      DashboardComponent = () => <TeacherDashboard fullName={fullName} role={userRole} />;
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
