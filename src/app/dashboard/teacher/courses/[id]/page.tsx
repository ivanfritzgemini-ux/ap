import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, BookOpen, GraduationCap, TrendingUp, Calendar, UserCheck } from "lucide-react"
import { requireTeacher } from "@/lib/auth"

interface CourseDetailPageProps {
  params: {
    id: string
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { user } = await requireTeacher();
  const supabase = await createServerClient();
  const courseId = (await params).id;

  // Verificar que el profesor tenga acceso a este curso
  // Puede acceder si: 1) Tiene asignaturas en el curso, o 2) Es profesor jefe del curso
  const { data: asignaturasProfesor } = await supabase
    .from('asignaturas')
    .select('id, nombre')
    .eq('profesor_id', user.id)
    .eq('curso_id', courseId);

  const { data: cursoComoJefe } = await supabase
    .from('cursos')
    .select('id')
    .eq('id', courseId)
    .eq('profesor_jefe_id', user.id)
    .single();

  const tieneAcceso = (asignaturasProfesor && asignaturasProfesor.length > 0) || cursoComoJefe;

  if (!tieneAcceso) {
    redirect('/dashboard/teacher/courses');
  }

  // Obtener información del curso
  const { data: curso } = await supabase
    .from('cursos')
    .select('*')
    .eq('id', courseId)
    .single();

  if (!curso) {
    redirect('/dashboard/teacher/courses');
  }

  // Obtener estudiantes del curso
  const { data: estudiantes } = await supabase
    .from('estudiantes_detalles')
    .select(`
      id,
      nombres,
      apellidos,
      sexo,
      fecha_matricula,
      es_matricula_actual,
      usuarios (
        email
      )
    `)
    .eq('curso_id', courseId)
    .eq('es_matricula_actual', true)
    .order('apellidos');

  // Obtener asignaturas del curso
  const { data: asignaturas } = await supabase
    .from('asignaturas')
    .select(`
      id,
      nombre,
      descripcion,
      profesor_id,
      usuarios (
        nombres,
        apellidos
      )
    `)
    .eq('curso_id', courseId);

  // Estadísticas
  const totalEstudiantes = estudiantes?.length || 0;
  const estudiantesMasculinos = estudiantes?.filter(e => e.sexo === 'Masculino').length || 0;
  const estudiantesFemeninos = estudiantes?.filter(e => e.sexo === 'Femenino').length || 0;

  // Simular estadísticas de asistencia (en un sistema real vendría de la BD)
  const asistenciaPromedio = Math.floor(Math.random() * 20) + 80; // 80-99%

  return (
    <div className="space-y-6">
      {/* Header con botón de volver */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <a href="/dashboard/teacher/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Mis Cursos
          </a>
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-headline font-semibold">
            {curso.nombre_curso}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Detalles del curso y estudiantes matriculados.
          </p>
        </div>
      </div>

      {/* Información general del curso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Información del Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Nombre del Curso</p>
              <p className="text-lg font-semibold">{curso.nombre_curso}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Nivel</p>
              <p className="text-lg font-semibold">{curso.nivel}º {curso.letra}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tipo de Enseñanza</p>
              <p className="text-lg font-semibold">{curso.tipo_ensenanza}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <Badge variant={curso.activo ? "default" : "secondary"}>
                {curso.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          {curso.descripcion && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Descripción</p>
              <p className="text-sm">{curso.descripcion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas del curso */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstudiantes}</div>
            <p className="text-xs text-muted-foreground">Matriculados actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asistenciaPromedio}%</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaturas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asignaturas?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Activas en el curso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribución por Sexo</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Masculino:</span>
                <span className="font-medium">{estudiantesMasculinos}</span>
              </div>
              <div className="flex justify-between">
                <span>Femenino:</span>
                <span className="font-medium">{estudiantesFemeninos}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle>Estudiantes Matriculados</CardTitle>
          <CardDescription>
            Lista completa de estudiantes actualmente matriculados en este curso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estudiantes && estudiantes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Fecha de Matrícula</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estudiantes.map((estudiante) => (
                  <TableRow key={estudiante.id}>
                    <TableCell className="font-medium">
                      {estudiante.apellidos}, {estudiante.nombres}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estudiante.sexo === 'Masculino' ? 'default' : 'secondary'}>
                        {estudiante.sexo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(estudiante.fecha_matricula).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {estudiante.usuarios?.[0]?.email || 'No disponible'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay estudiantes matriculados</h3>
              <p className="text-muted-foreground">
                Actualmente no hay estudiantes matriculados en este curso.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asignaturas del curso */}
      <Card>
        <CardHeader>
          <CardTitle>Asignaturas del Curso</CardTitle>
          <CardDescription>
            Todas las asignaturas impartidas en este curso y sus profesores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {asignaturas && asignaturas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id}>
                    <TableCell className="font-medium">{asignatura.nombre}</TableCell>
                    <TableCell>
                      {asignatura.usuarios
                        ? `${asignatura.usuarios[0].nombres} ${asignatura.usuarios[0].apellidos}`
                        : 'No asignado'
                      }
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {asignatura.descripcion || 'Sin descripción'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay asignaturas asignadas</h3>
              <p className="text-muted-foreground">
                No se han asignado asignaturas a este curso aún.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}