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
import { Users, BookOpen, GraduationCap, Eye, TrendingUp, Calendar } from "lucide-react"
import { requireTeacher } from "@/lib/auth"

export default async function TeacherCoursesPage() {
  const { user } = await requireTeacher();
  const supabase = await createServerClient();

  // Obtener asignaturas del docente
  const { data: asignaturas } = await supabase
    .from('asignaturas')
    .select('id, nombre, descripcion, curso_id')
    .eq('profesor_id', user.id);

  // Obtener cursos únicos
  const cursoIds = [...new Set(asignaturas?.map(a => a.curso_id).filter(Boolean) || [])];
  const { data: cursos } = cursoIds.length > 0 ? await supabase
    .from('cursos')
    .select('id, nombre_curso, tipo_ensenanza, nivel, letra')
    .in('id', cursoIds) : { data: [] };

  const cursosMap = new Map(cursos?.map(c => [c.id, c]) || []);

  // Obtener estadísticas de estudiantes por curso
  const courseStats: Record<string, number> = {};
  if (asignaturas) {
    for (const asignatura of asignaturas) {
      if (asignatura.curso_id) {
        const { count } = await supabase
          .from('estudiantes_detalles')
          .select('id', { count: 'exact', head: true })
          .eq('curso_id', asignatura.curso_id)
          .eq('es_matricula_actual', true);
        courseStats[asignatura.curso_id] = count || 0;
      }
    }
  }

  // Obtener estadísticas adicionales
  const totalStudents = Object.values(courseStats).reduce((sum, count) => sum + count, 0);
  const totalCourses = cursoIds.length;
  const avgStudentsPerCourse = totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0;

  // Obtener estadísticas de asistencia promedio por curso (simulado)
  const attendanceStats: Record<string, number> = {};
  if (asignaturas) {
    for (const asignatura of asignaturas) {
      if (asignatura.curso_id) {
        // En un sistema real, esto vendría de la tabla de asistencia
        attendanceStats[asignatura.curso_id] = Math.floor(Math.random() * 20) + 80; // 80-99%
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Mis Cursos</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Cursos en los que impartes asignaturas este período académico.
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">Cursos asignados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Estudiantes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaturas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asignaturas?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Asignaturas impartidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Curso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgStudentsPerCourse}</div>
            <p className="text-xs text-muted-foreground">Estudiantes/curso</p>
          </CardContent>
        </Card>
      </div>

      {asignaturas && asignaturas.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {asignaturas.map((asignatura) => {
            const curso = cursosMap.get(asignatura.curso_id);
            const studentCount = courseStats[asignatura.curso_id || ''] || 0;

            return (
              <Card key={asignatura.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{curso?.nombre_curso || 'Curso no asignado'}</CardTitle>
                    <Badge variant="secondary">{curso?.tipo_ensenanza}</Badge>
                  </div>
                  <CardDescription>{asignatura.nombre}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{studentCount} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{asignatura.descripcion || 'Sin descripción'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>Asistencia: {attendanceStats[asignatura.curso_id || ''] || 0}%</span>
                    </div>
                    {curso?.nivel && curso?.letra && (
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{curso.nivel}º {curso.tipo_ensenanza} {curso.letra}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={`/dashboard/teacher/courses/${asignatura.curso_id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Detalles
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href="/dashboard/teacher/classes">
                          <Calendar className="h-3 w-3 mr-1" />
                          Ver Clases
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes cursos asignados</h3>
            <p className="text-muted-foreground text-center">
              Actualmente no tienes asignaturas asignadas a ningún curso.
              <br />
              Contacta al administrador para asignarte cursos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabla detallada */}
      {asignaturas && asignaturas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Asignaturas</CardTitle>
            <CardDescription>
              Vista detallada de todas tus asignaturas y cursos asignados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estudiantes</TableHead>
                  <TableHead>Asistencia</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaturas.map((asignatura) => {
                  const curso = cursosMap.get(asignatura.curso_id);
                  const studentCount = courseStats[asignatura.curso_id || ''] || 0;
                  const attendanceRate = attendanceStats[asignatura.curso_id || ''] || 0;

                  return (
                    <TableRow key={asignatura.id}>
                      <TableCell className="font-medium">{asignatura.nombre}</TableCell>
                      <TableCell>{curso?.nombre_curso || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{curso?.tipo_ensenanza || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{studentCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-muted rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{attendanceRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Detalles
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}