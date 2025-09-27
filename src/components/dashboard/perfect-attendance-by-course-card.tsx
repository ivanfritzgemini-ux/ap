"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Users, Award, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EstudiantePerfecto {
  id: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  diasPresente: number
  diasRegistrados: number
  fechaMatricula?: string
  fechaRetiro?: string
}

interface CursoResultados {
  curso_id: string
  nombre_curso: string
  estudiantes_perfectos: EstudiantePerfecto[]
  total_estudiantes: number
  porcentaje_perfectos: number
}

interface DatosAsistencia {
  mes: number
  año: number
  total_dias_habiles: number
  cursos: CursoResultados[]
  total_estudiantes_perfectos: number
  resumen: {
    cursos_con_perfectos: number
    cursos_sin_perfectos: number
    promedio_por_curso: number
  }
}

const meses = [
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' }
]

export function PerfectAttendanceByCourseCard() {
  // El mes actual (1-12)
  const mesActual = new Date().getMonth() + 1;
  // Si el mes actual es enero o febrero, por defecto mostrar marzo
  const mesDefault = mesActual < 3 ? 3 : mesActual;
  const [selectedMes, setSelectedMes] = useState<string>(mesDefault.toString())
  const [selectedAño, setSelectedAño] = useState<string>(new Date().getFullYear().toString())
  const [datos, setDatos] = useState<DatosAsistencia | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const cargarDatos = async () => {
    if (!selectedMes || !selectedAño) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/asistencia/perfecta-por-curso?mes=${selectedMes.padStart(2, '0')}&año=${selectedAño}`
      )

      if (!response.ok) {
        throw new Error('Error al cargar datos de asistencia')
      }

      const result = await response.json()
      setDatos(result)
    } catch (error: any) {
      console.error('Error al cargar estudiantes con asistencia perfecta por curso:', error)
      toast({
        title: "Error al cargar datos",
        description: error.message || 'No se pudieron cargar los datos de asistencia',
        variant: "destructive",
        duration: 3000,
      })
      setDatos(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [selectedMes, selectedAño])

  const generarReporte = () => {
    if (!datos) return

    const mesNombre = meses.find(m => m.valor === datos.mes)?.nombre || ''
    const contenidoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Asistencia Perfecta por Curso - ${mesNombre} ${datos.año}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2563eb; text-align: center; }
          h2 { color: #374151; margin-top: 30px; }
          .curso { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .curso-header { background: #f3f4f6; padding: 10px; margin: -15px -15px 15px -15px; border-radius: 8px 8px 0 0; }
          .estudiante { margin: 5px 0; padding: 5px; background: #ecfdf5; border-radius: 4px; }
          .resumen { background: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .estadisticas { display: flex; justify-content: space-around; margin: 20px 0; }
          .estadistica { text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>Alumnos con Asistencia 100% por Curso</h1>
        <h2>${mesNombre} ${datos.año}</h2>

        <div class="resumen">
          <h3>Resumen General</h3>
          <div class="estadisticas">
            <div class="estadistica">
              <strong>${datos.total_estudiantes_perfectos}</strong><br>
              Total de estudiantes con 100%
            </div>
            <div class="estadistica">
              <strong>${datos.resumen.cursos_con_perfectos}</strong><br>
              Cursos con estudiantes perfectos
            </div>
            <div class="estadistica">
              <strong>${datos.total_dias_habiles}</strong><br>
              Días hábiles del mes
            </div>
            <div class="estadistica">
              <strong>${datos.resumen.promedio_por_curso}</strong><br>
              Promedio de estudiantes perfectos por curso
            </div>
          </div>
        </div>

        ${datos.cursos
          .filter(curso => curso.estudiantes_perfectos.length > 0)
          .map(curso => `
            <div class="curso">
              <div class="curso-header">
                <h3>${curso.nombre_curso}</h3>
                <p><strong>${curso.total_estudiantes}</strong> estudiante(s) con 100% de asistencia</p>
              </div>
              ${curso.estudiantes_perfectos.map(estudiante => `
                <div class="estudiante">
                  <strong>${estudiante.nombreCompleto}</strong><br>
                  <small>Días asistidos: ${estudiante.diasPresente} de ${estudiante.diasRegistrados}</small>
                </div>
              `).join('')}
            </div>
          `).join('')}

        ${datos.resumen.cursos_sin_perfectos > 0 ? `
          <div class="resumen">
            <p><strong>${datos.resumen.cursos_sin_perfectos}</strong> cursos no tienen estudiantes con 100% de asistencia este mes.</p>
          </div>
        ` : ''}
      </body>
      </html>
    `

    const blob = new Blob([contenidoHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asistencia-perfecta-por-curso-${mesNombre.toLowerCase()}-${datos.año}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Reporte generado",
      description: `Se descargó el reporte de asistencia perfecta por curso para ${mesNombre} ${datos.año}`,
      duration: 3000,
    })
  }

  const mesNombre = meses.find(m => m.valor.toString() === selectedMes)?.nombre || ''

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Asistencia Perfecta por Curso
            </CardTitle>
            <CardDescription>
              Estudiantes con 100% de asistencia agrupados por curso. Solo se muestran cursos con estudiantes perfectos.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMes} onValueChange={setSelectedMes}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes) => (
                  <SelectItem key={mes.valor} value={mes.valor.toString()}>
                    {mes.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedAño} onValueChange={setSelectedAño}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando datos de asistencia...</div>
          </div>
        ) : datos ? (
          <div className="space-y-6">
            {/* Estadísticas generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{datos.total_estudiantes_perfectos}</div>
                <div className="text-sm text-muted-foreground">Estudiantes con 100%</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{datos.resumen.cursos_con_perfectos}</div>
                <div className="text-sm text-muted-foreground">Cursos con perfectos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{datos.total_dias_habiles}</div>
                <div className="text-sm text-muted-foreground">Días hábiles</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{datos.resumen.promedio_por_curso}</div>
                <div className="text-sm text-muted-foreground">Promedio por curso</div>
              </div>
            </div>

            {/* Lista de cursos con estudiantes perfectos */}
            <div className="space-y-4">
              {datos.cursos
                .filter(curso => curso.estudiantes_perfectos.length > 0)
                .map((curso) => (
                  <div key={curso.curso_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{curso.nombre_curso}</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {curso.total_estudiantes} estudiante{curso.total_estudiantes !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      {curso.estudiantes_perfectos.map((estudiante) => (
                        <div key={estudiante.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{estudiante.nombreCompleto}</span>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            {estudiante.diasPresente}/{estudiante.diasRegistrados} días
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {datos.cursos.filter(c => c.estudiantes_perfectos.length > 0).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay estudiantes con 100% de asistencia en {mesNombre} {selectedAño}</p>
              </div>
            )}

            {/* Botón de descarga */}
            <div className="flex justify-center pt-4">
              <Button onClick={generarReporte} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Descargar Reporte
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se pudieron cargar los datos de asistencia</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}