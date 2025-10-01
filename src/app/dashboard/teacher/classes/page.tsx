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
import { Calendar, Clock, MapPin, Users, BookOpen } from "lucide-react"
import { requireTeacher } from "@/lib/auth"

export default async function TeacherClassesPage() {
  const { user } = await requireTeacher();
  const supabase = await createServerClient();

  // Obtener asignaturas del docente con información de cursos
  const { data: asignaturas } = await supabase
    .from('asignaturas')
    .select(`
      id,
      nombre,
      descripcion,
      cursos (
        id,
        nombre_curso,
        tipo_ensenanza,
        nivel,
        letra
      )
    `)
    .eq('profesor_id', user.id);

  // Obtener estadísticas de estudiantes por asignatura
  const studentStats: Record<string, number> = {};
  if (asignaturas) {
    for (const asignatura of asignaturas) {
      if (asignatura.cursos?.[0]?.id) {
        const { count } = await supabase
          .from('estudiantes_detalles')
          .select('id', { count: 'exact', head: true })
          .eq('curso_id', asignatura.cursos[0].id)
          .eq('es_matricula_actual', true);
        studentStats[asignatura.id] = count || 0;
      }
    }
  }

  // Simular horario semanal (en un sistema real, esto vendría de una tabla de horarios)
  const scheduleData = [
    { day: 'Lunes', time: '9:00 - 10:00', subject: asignaturas?.[0]?.nombre || 'Matemáticas', course: asignaturas?.[0]?.cursos?.[0]?.nombre_curso || '1A', room: '101' },
    { day: 'Lunes', time: '10:15 - 11:15', subject: asignaturas?.[1]?.nombre || 'Lenguaje', course: asignaturas?.[1]?.cursos?.[0]?.nombre_curso || '1B', room: '102' },
    { day: 'Martes', time: '9:00 - 10:00', subject: asignaturas?.[2]?.nombre || 'Ciencias', course: asignaturas?.[2]?.cursos?.[0]?.nombre_curso || '2A', room: '201' },
    { day: 'Miércoles', time: '14:00 - 15:00', subject: asignaturas?.[0]?.nombre || 'Matemáticas', course: asignaturas?.[0]?.cursos?.[0]?.nombre_curso || '1A', room: '101' },
    { day: 'Jueves', time: '11:00 - 12:00', subject: asignaturas?.[1]?.nombre || 'Lenguaje', course: asignaturas?.[1]?.cursos?.[0]?.nombre_curso || '1B', room: '102' },
    { day: 'Viernes', time: '10:00 - 11:00', subject: asignaturas?.[2]?.nombre || 'Ciencias', course: asignaturas?.[2]?.cursos?.[0]?.nombre_curso || '2A', room: '201' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Mis Clases</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Horario y asignaturas que impartes esta semana.
        </p>
      </div>

      {/* Resumen de asignaturas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asignaturas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{asignaturas?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Asignaturas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases Semanales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleData.length}</div>
            <p className="text-xs text-muted-foreground">Clases programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(studentStats).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Estudiantes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Semanales</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleData.length * 1}</div>
            <p className="text-xs text-muted-foreground">Horas de clase</p>
          </CardContent>
        </Card>
      </div>

      {/* Horario semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Horario Semanal</CardTitle>
          <CardDescription>
            Tu horario de clases para esta semana académica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => {
              const dayClasses = scheduleData.filter(cls => cls.day === day);

              return (
                <Card key={day} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayClasses.length > 0 ? (
                      dayClasses.map((cls, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{cls.subject}</span>
                            <Badge variant="outline" className="text-xs">{cls.time}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {cls.course}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cls.room}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Sin clases programadas
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista detallada de asignaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Asignaturas</CardTitle>
          <CardDescription>
            Detalle de todas las asignaturas que impartes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {asignaturas && asignaturas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Estudiantes</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id}>
                    <TableCell className="font-medium">{asignatura.nombre}</TableCell>
                    <TableCell>{asignatura.cursos?.[0]?.nombre_curso || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {asignatura.cursos?.[0]?.nivel}º {asignatura.cursos?.[0]?.tipo_ensenanza} {asignatura.cursos?.[0]?.letra}
                      </Badge>
                    </TableCell>
                    <TableCell>{studentStats[asignatura.id] || 0}</TableCell>
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
              <h3 className="text-lg font-semibold mb-2">No tienes asignaturas asignadas</h3>
              <p className="text-muted-foreground">
                Actualmente no tienes asignaturas asignadas.
                <br />
                Contacta al administrador para asignarte asignaturas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}