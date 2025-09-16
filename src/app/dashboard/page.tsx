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
import { Users, BookOpen, Briefcase, ClipboardCheck, ArrowUpRight, UserPlus, UserMinus, Book, GraduationCap, UserCheck, CheckCircle } from "lucide-react"
import { EnrollmentChart } from "@/components/dashboard/admin/enrollment-chart"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const AdminDashboard = ({ fullName, role, totalStudents, totalTeachers, totalCourses, activeClasses, enrollmentData }: { fullName: string; role: string, totalStudents:number, totalTeachers:number, totalCourses:number, activeClasses:number, enrollmentData:{month:string;enrollments:number}[] }) => (
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
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCourses}</div>
          <p className="text-xs text-muted-foreground">Todos los cursos disponibles</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clases Activas</CardTitle>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClasses}</div>
          <p className="text-xs text-muted-foreground">Clases en curso hoy</p>
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
          <Select defaultValue="agosto">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Seleccione un mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agosto">Agosto</SelectItem>
              <SelectItem value="julio">Julio</SelectItem>
              <SelectItem value="junio">Junio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-green-900/50 p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-500/20">
            <UserPlus className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-green-400">Nuevos Ingresos</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
        <div className="rounded-lg bg-red-900/50 p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-500/20">
            <UserMinus className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <p className="text-sm text-red-400">Alumnos Retirados</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Resumen de Inscripciones</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
           <EnrollmentChart data={enrollmentData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimas actualizaciones y adiciones al sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-1">
                <Book className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Nuevo Curso Agregado</p>
                <p className="text-xs text-muted-foreground">"Intro a CS" por Dr. Alan Turing</p>
              </div>
              <time className="ml-auto text-xs text-muted-foreground">hace 5m</time>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-1">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Profesor Actualizado</p>
                <p className="text-xs text-muted-foreground">Sra. Jones ahora enseña "Historia Moderna"</p>
              </div>
              <time className="ml-auto text-xs text-muted-foreground">hace 3h</time>
            </li>
             <li className="flex items-start gap-3">
              <div className="flex-shrink-0 pt-1">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Estudiante Inscrito</p>
                <p className="text-xs text-muted-foreground">Diana Miller se inscribió en "Cálculo I"</p>
              </div>
              <time className="ml-auto text-xs text-muted-foreground">hace 3h</time>
            </li>
          </ul>
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
                        <TableRow>
                            <TableCell>1° A</TableCell>
                            <TableCell className="text-right">1</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>2° C</TableCell>
                            <TableCell className="text-right">0</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>1° B</TableCell>
                            <TableCell className="text-right">0</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>2° A</TableCell>
                            <TableCell className="text-right">0</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5"/>
                    Alumnos con Asistencia 100%
                </CardTitle>
                <CardDescription>Selecciona un mes para ver el listado y generar un informe para imprimir.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Select defaultValue="junio">
                    <SelectTrigger className="w-full md:w-[180px] mb-4">
                        <SelectValue placeholder="Seleccione un mes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="agosto">Agosto</SelectItem>
                        <SelectItem value="julio">Julio</SelectItem>
                        <SelectItem value="junio">Junio</SelectItem>
                    </SelectContent>
                </Select>
                 <div className="border rounded-lg p-4 h-48 flex items-center justify-center">
                    <p className="text-muted-foreground">No hay alumnos con 100% de asistencia para el mes seleccionado.</p>
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
    let enrollmentData: { month: string; enrollments: number }[] = []

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

      // enrollment rows for monthly aggregation
  const enrollRes = await supabase.from('estudiantes_detalles').select('fecha_matricula')
  const enrollRows = enrollRes.data as any
      // Heuristic for totalTeachers: query roles table for 'profesor' role id then count users
      try {
  const rolesRes = (await supabase.from('roles').select('id,nombre_rol')).data as any
  const teacherRole = (rolesRes || []).find((r: any) => /profesor|teacher/i.test(r.nombre_rol))
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
            return /profesor|teacher/i.test(name || '')
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
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
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
      enrollmentData = months.map((m, i) => ({ month: m, enrollments: counts[i] || 0 }))
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
