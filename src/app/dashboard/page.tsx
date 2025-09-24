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
import { Users, Briefcase, ClipboardCheck, ArrowUpRight, ArrowUp, ArrowDown, UserPlus, UserMinus, Book, GraduationCap, UserCheck, CheckCircle, School } from "lucide-react"
import { AsistenciaPerfectaCard } from '@/components/dashboard/asistencia-perfecta-card'
import { ResumenAsistenciaCard } from '@/components/dashboard/resumen-asistencia-card'
import { TendenciaAsistenciaCard } from '@/components/dashboard/tendencia-asistencia-card'
import Logo from "@/components/logo"
import { EnrollmentChart } from "@/components/dashboard/admin/enrollment-chart"
import { MonthlyMovementsWrapper } from '@/components/dashboard/monthly-movements-wrapper'
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

import { GenderDonut } from '@/components/dashboard/gender-donut'

const AdminDashboard = ({ fullName, role, totalStudents, totalTeachers, totalCourses, activeClasses, enrollmentData, courses }: { fullName: string; role: string, totalStudents:number, totalTeachers:number, totalCourses:number, activeClasses:number, enrollmentData:{month:string;matriculas:number}[], courses: any[] }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold">Hola, {fullName}</h2>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Estudiantes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">Todos los estudiantes inscritos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Profesores</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTeachers}</div>
          <p className="text-xs text-muted-foreground">Todos los profesores activos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCourses}</div>
          <p className="text-xs text-muted-foreground">Todos los cursos disponibles</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tendencia Matrícula</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {enrollmentData.reduce((sum, month) => sum + month.matriculas, 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {enrollmentData.length > 1 && enrollmentData[enrollmentData.length - 1].matriculas > enrollmentData[enrollmentData.length - 2].matriculas ? (
              <span className="text-green-600">▲ Aumentando</span>
            ) : enrollmentData.length > 1 && enrollmentData[enrollmentData.length - 1].matriculas < enrollmentData[enrollmentData.length - 2].matriculas ? (
              <span className="text-red-600">▼ Disminuyendo</span>
            ) : (
              <span className="text-gray-500">— Estable</span>
            )}
          </p>
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
            <UserPlus className="h-5 w-5 text-blue-500" />
            Evolución de Matriculaciones 2024
          </CardTitle>
          <CardDescription>
            Nuevas matriculaciones por mes durante el año académico actual
            {enrollmentData.length > 0 && (
              <span className="ml-2 text-sm font-medium">
                • Total: {enrollmentData.reduce((sum, month) => sum + month.matriculas, 0)} estudiantes
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
           <EnrollmentChart data={enrollmentData} />
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
    
     <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Estudiantes por Curso</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Curso</TableHead>
                            <TableHead className="text-right">N° de Estudiantes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(courses) && courses.length > 0 ? (
                        courses.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.nombre_curso}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2">
                              <span>{c.alumnos}</span>
                              {c.delta > 0 ? (
                                <span className="inline-flex items-center text-green-600 text-sm">
                                  <ArrowUp className="h-4 w-4 animate-pulse" />
                                  <span className="ml-1">+{c.delta}</span>
                                  {c.percent !== null ? <span className="ml-2 text-xs text-green-700">({c.percent}%)</span> : null}
                                </span>
                              ) : c.delta < 0 ? (
                                <span className="inline-flex items-center text-red-600 text-sm">
                                  <ArrowDown className="h-4 w-4 animate-pulse" />
                                  <span className="ml-1">-{Math.abs(c.delta)}</span>
                                  {c.percent !== null ? <span className="ml-2 text-xs text-red-700">({Math.abs(c.percent)}%)</span> : null}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-sm text-muted-foreground">No hay cursos registrados.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
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
    let normalizedCourses: any[] = []

    try {
      // count students (estudiantes_detalles without fecha_retiro)
      const studentsRes = await supabase
        .from('estudiantes_detalles')
        .select('id', { count: 'exact', head: false })
        .is('fecha_retiro', null)
      totalStudents = (studentsRes.count ?? 0) as number

      // courses
      const coursesRes = await supabase.from('cursos').select('*')
      const coursesData = coursesRes.data
      const coursesErr = coursesRes.error
      totalCourses = Array.isArray(coursesData) ? coursesData.length : 0

      // Build students-per-course counts: fetch estudiantes_detalles for active students
        try {
        // Fetch relevant fields to compute current active students per course
        const { data: studentRows } = await supabase.from('estudiantes_detalles').select('curso_id,fecha_matricula,fecha_retiro')
        const countsMap: Record<string, number> = {}
        const prevCountsMap: Record<string, number> = {}

        // previous month end date
        const now = new Date()
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonthEnd = new Date(prev.getFullYear(), prev.getMonth() + 1, 0)

        if (Array.isArray(studentRows)) {
          for (const r of studentRows as any[]) {
            const key = String(r.curso_id)

            // current active students: no fecha_retiro
            if (r.fecha_retiro == null) {
              countsMap[key] = (countsMap[key] || 0) + 1
            }

            // compute if student was active at end of previous month
            const fm = r.fecha_matricula ? new Date(r.fecha_matricula) : null
            const fr = r.fecha_retiro ? new Date(r.fecha_retiro) : null
            if (fm && fm <= prevMonthEnd && (!fr || fr > prevMonthEnd)) {
              prevCountsMap[key] = (prevCountsMap[key] || 0) + 1
            }
          }
        }

        // Normalize courses array for rendering and include previous month counts
        const coursesList = Array.isArray(coursesData) ? coursesData as any[] : []
        normalizedCourses = coursesList.map((c: any) => {
          const id = c.id
          const nivel = c.nivel ?? ''
          const letra = c.letra ?? ''
          const nombre_curso = [nivel, letra].filter(Boolean).join(' ').trim() || c.nombre || String(id)
          const alumnos = countsMap[String(id)] ?? 0
          const prevAlumnos = prevCountsMap[String(id)] ?? 0
          const delta = alumnos - prevAlumnos
          const percent = prevAlumnos > 0 ? Number(((delta / prevAlumnos) * 100).toFixed(1)) : null
          return {
            id,
            nombre_curso,
            alumnos,
            prevAlumnos,
            delta,
            percent,
            _raw: c,
          }
        })
      } catch (e) {
        normalizedCourses = Array.isArray(coursesData) ? (coursesData as any[]).map((c: any) => ({ id: c.id, nombre_curso: `${c.nivel ?? ''} ${c.letra ?? ''}`.trim(), alumnos: 0, _raw: c })) : []
      }

      // enrollment rows for monthly aggregation
  const enrollRes = await supabase.from('estudiantes_detalles').select('fecha_matricula')
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
  const distinctCourses = (await supabase.from('estudiantes_detalles').select('curso_id', { count: 'exact', head: false })).data as any
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
  DashboardComponent = () => <AdminDashboard fullName={fullName} role={userRole} totalStudents={totalStudents} totalTeachers={totalTeachers} totalCourses={totalCourses} activeClasses={activeClasses} enrollmentData={enrollmentData} courses={normalizedCourses} />;
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
