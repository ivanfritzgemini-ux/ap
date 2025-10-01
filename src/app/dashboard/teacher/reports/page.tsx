import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart2, FileText, Users, TrendingUp, Download } from "lucide-react"
import { requireTeacher } from "@/lib/auth"

export default async function TeacherReportsPage() {
  const { user } = await requireTeacher();
  const supabase = await createServerClient();

  // Obtener asignaturas del docente para generar reportes
  const { data: asignaturas } = await supabase
    .from('asignaturas')
    .select('id, nombre, curso_id')
    .eq('profesor_id', user.id);

  // Placeholder para estadísticas - en un sistema real, esto vendría de consultas específicas
  const reportStats = {
    totalAsignaturas: asignaturas?.length || 0,
    estudiantesTotales: 0, // Calcular basado en cursos
    asistenciaPromedio: 92,
    calificacionesPendientes: 5
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Reportes</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Genera y visualiza reportes de tus asignaturas, asistencia y calificaciones.
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.totalAsignaturas}</div>
            <p className="text-xs text-muted-foreground">Con reportes disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.estudiantesTotales}</div>
            <p className="text-xs text-muted-foreground">En tus cursos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.asistenciaPromedio}%</div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificaciones Pendientes</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats.calificacionesPendientes}</div>
            <p className="text-xs text-muted-foreground">Por ingresar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de reportes disponibles */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Reporte de Asistencia
            </CardTitle>
            <CardDescription>
              Resumen de asistencia por asignatura y período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Último generado:</span>
                <span className="text-muted-foreground">Hace 2 días</span>
              </div>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-green-500" />
              Reporte de Calificaciones
            </CardTitle>
            <CardDescription>
              Análisis de calificaciones por asignatura y curso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Último generado:</span>
                <span className="text-muted-foreground">Hace 1 semana</span>
              </div>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Reporte de Estudiantes
            </CardTitle>
            <CardDescription>
              Lista de estudiantes por curso con información detallada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Último generado:</span>
                <span className="text-muted-foreground">Hoy</span>
              </div>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes</CardTitle>
          <CardDescription>
            Historial de reportes generados recientemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Reporte de Asistencia - Septiembre 2025</p>
                  <p className="text-sm text-muted-foreground">Generado el 25/09/2025</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">PDF</Badge>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Análisis de Calificaciones - Segundo Trimestre</p>
                  <p className="text-sm text-muted-foreground">Generado el 20/09/2025</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Excel</Badge>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Lista de Estudiantes - Todos los Cursos</p>
                  <p className="text-sm text-muted-foreground">Generado el 27/09/2025</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">PDF</Badge>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información sobre Reportes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Los reportes se generan automáticamente con la información más actualizada del sistema.
              Puedes descargarlos en formato PDF o Excel según tus necesidades.
            </p>
            <p>
              Para reportes personalizados o con filtros específicos, contacta al administrador del sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}