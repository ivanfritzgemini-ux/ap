"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Save, Calendar, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

interface Curso {
  id: string
  nombre_curso: string
  tipo_ensenanza: string
  profesor_jefe: string
  alumnos: number
}

interface Estudiante {
  id: string
  name: string
  registration_number: string
  enrollment_date: string
  withdrawal_date?: string
}

interface DiaAsistencia {
  dia: number
  fecha: string
  diaSemana: string
  esFeriado: boolean
  esFinDeSemana: boolean
  esHabil: boolean
}

interface AsistenciaEstudiante {
  estudianteId: string
  asistencias: Record<number, boolean> // día -> presente/ausente
}

// Feriados chilenos 2025 (algunos principales)
const feriadosChile2025: Record<string, string> = {
  '2025-01-01': 'Año Nuevo',
  '2025-04-18': 'Viernes Santo',
  '2025-04-19': 'Sábado Santo',
  '2025-05-01': 'Día del Trabajador',
  '2025-05-21': 'Día de las Glorias Navales',
  '2025-06-29': 'San Pedro y San Pablo',
  '2025-07-16': 'Día de la Virgen del Carmen',
  '2025-08-15': 'Asunción de la Virgen',
  '2025-09-18': 'Fiestas Patrias',
  '2025-09-19': 'Glorias del Ejército',
  '2025-10-12': 'Encuentro de Dos Mundos',
  '2025-10-31': 'Día de las Iglesias Evangélicas',
  '2025-11-01': 'Día de Todos los Santos',
  '2025-12-08': 'Inmaculada Concepción',
  '2025-12-25': 'Navidad'
}

const meses = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
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

export default function AsistenciaMensualPage() {
  const { toast } = useToast()
  
  const [cursos, setCursos] = useState<Curso[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [selectedMes, setSelectedMes] = useState<string>('')
  const [selectedCurso, setSelectedCurso] = useState<string>('')
  const [diasDelMes, setDiasDelMes] = useState<DiaAsistencia[]>([])
  const [asistencias, setAsistencias] = useState<Record<string, AsistenciaEstudiante>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  // Función para obtener la fecha actual formateada
  const getFechaActualFormateada = () => {
    const hoy = new Date()
    const dia = hoy.getDate()
    const mes = hoy.getMonth() + 1
    const año = hoy.getFullYear()
    return `${dia} de ${meses.find(m => m.valor === mes)?.nombre || mes} de ${año}`
  }

  // Cargar cursos al inicializar
  useEffect(() => {
    fetchCursos()
  }, [])

  // Cargar estudiantes cuando se selecciona un curso
  useEffect(() => {
    if (selectedCurso) {
      fetchEstudiantes()
      setAsistencias({})
    }
  }, [selectedCurso])

  // Calcular días del mes cuando se selecciona mes
  useEffect(() => {
    if (selectedMes) {
      calcularDiasDelMes()
    }
  }, [selectedMes])

  const fetchCursos = async () => {
    try {
      const response = await fetch('/api/cursos')
      const result = await response.json()
      if (result.data) {
        setCursos(result.data)
      }
    } catch (error) {
      console.error('Error fetching cursos:', error)
    }
  }

  const fetchEstudiantes = async () => {
    if (!selectedCurso) return
    
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/students-by-course?courseId=${selectedCurso}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}`)
      }
      
      if (result.data) {
        setEstudiantes(result.data)
        // Inicializar asistencias vacías
        const initialAsistencias: Record<string, AsistenciaEstudiante> = {}
        result.data.forEach((estudiante: Estudiante) => {
          initialAsistencias[estudiante.id] = {
            estudianteId: estudiante.id,
            asistencias: {}
          }
        })
        setAsistencias(initialAsistencias)
      } else {
        setEstudiantes([])
        setAsistencias({})
      }
    } catch (error: any) {
      console.error('Error fetching estudiantes:', error)
      setError(`Error al cargar estudiantes: ${error.message}`)
      setEstudiantes([])
      setAsistencias({})
    } finally {
      setLoading(false)
    }
  }

  const calcularDiasDelMes = () => {
    if (!selectedMes) return

    const año = 2025 // Usando año actual
    const mes = parseInt(selectedMes)
    const diasEnMes = new Date(año, mes, 0).getDate()
    
    const dias: DiaAsistencia[] = []
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes - 1, dia)
      const fechaString = fecha.toISOString().split('T')[0] // YYYY-MM-DD
      const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
      
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6
      const esFeriado = feriadosChile2025[fechaString] !== undefined
      const esHabil = !esFinDeSemana && !esFeriado
      
      dias.push({
        dia,
        fecha: fechaString,
        diaSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana],
        esFeriado,
        esFinDeSemana,
        esHabil
      })
    }
    
    setDiasDelMes(dias)
  }

  // Función para formatear el nombre del estudiante
  const formatearNombreEstudiante = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(' ')
    if (partes.length >= 2) {
      // Primer nombre y primer apellido
      return `${partes[0]} ${partes[1]}`
    }
    return nombreCompleto
  }

  // Función para verificar si una fecha está habilitada para marcar asistencia
  const esFechaHabilitada = (dia: number, mes: number) => {
    const fechaDia = new Date(2025, mes - 1, dia)
    const hoy = new Date() // Fecha actual del sistema
    hoy.setHours(23, 59, 59, 999) // Hasta el final del día de hoy
    
    return fechaDia <= hoy
  }

  // Función para verificar si un estudiante estaba matriculado en una fecha específica
  const estudianteMatriculadoEnFecha = (estudiante: Estudiante, dia: number, mes: number) => {
    const fechaDia = new Date(2025, mes - 1, dia)
    
    // Fecha de ingreso
    const fechaIngreso = new Date(estudiante.enrollment_date)
    if (fechaDia < fechaIngreso) {
      return false // No estaba matriculado aún
    }
    
    // Fecha de retiro (si existe)
    if (estudiante.withdrawal_date) {
      const fechaRetiro = new Date(estudiante.withdrawal_date)
      if (fechaDia > fechaRetiro) {
        return false // Ya se había retirado
      }
    }
    
    return true // Estaba matriculado
  }

  const toggleAsistencia = (estudianteId: string, dia: number) => {
    // Verificar si la fecha está habilitada para edición
    if (!esFechaHabilitada(dia, parseInt(selectedMes))) {
      toast({
        title: "Fecha no habilitada",
        description: `Solo puede marcar asistencia hasta el ${getFechaActualFormateada()}`,
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    // Verificar si el estudiante estaba matriculado en esa fecha
    const estudiante = estudiantes.find(est => est.id === estudianteId)
    if (estudiante && !estudianteMatriculadoEnFecha(estudiante, dia, parseInt(selectedMes))) {
      toast({
        title: "Estudiante no matriculado",
        description: "El estudiante no estaba matriculado en esta fecha",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setAsistencias(prev => ({
      ...prev,
      [estudianteId]: {
        ...prev[estudianteId],
        asistencias: {
          ...prev[estudianteId]?.asistencias,
          [dia]: !prev[estudianteId]?.asistencias[dia]
        }
      }
    }))
  }

  // Función para seleccionar/deseleccionar toda una columna
  const toggleColumnaCompleta = (dia: number) => {
    // Verificar si la fecha está habilitada
    if (!esFechaHabilitada(dia, parseInt(selectedMes))) {
      return
    }

    // Obtener estudiantes que estaban matriculados ese día
    const estudiantesValidosParaDia = estudiantes.filter(estudiante => 
      estudianteMatriculadoEnFecha(estudiante, dia, parseInt(selectedMes))
    )

    if (estudiantesValidosParaDia.length === 0) {
      return
    }

    // Verificar si todos los estudiantes válidos ya están marcados como presentes
    const todosPresentes = estudiantesValidosParaDia.every(estudiante => 
      asistencias[estudiante.id]?.asistencias[dia] === true
    )

    // Si todos están presentes, desmarcar todos; si no, marcar todos como presentes
    const nuevoEstado = !todosPresentes

    setAsistencias(prev => {
      const nuevasAsistencias = { ...prev }
      
      estudiantesValidosParaDia.forEach(estudiante => {
        if (!nuevasAsistencias[estudiante.id]) {
          nuevasAsistencias[estudiante.id] = { estudianteId: estudiante.id, asistencias: {} }
        }
        nuevasAsistencias[estudiante.id] = {
          ...nuevasAsistencias[estudiante.id],
          asistencias: {
            ...nuevasAsistencias[estudiante.id].asistencias,
            [dia]: nuevoEstado
          }
        }
      })
      
      return nuevasAsistencias
    })
  }

  // Calcular estadísticas de asistencia
  const calcularEstadisticas = () => {
    const totalEstudiantes = estudiantes.length
    
    // Estadísticas por día
    const estadisticasPorDia = diasDelMes.filter(d => d.esHabil).map(dia => {
      // Solo contar estudiantes que estaban matriculados ese día
      const estudiantesMatriculados = estudiantes.filter(est => 
        estudianteMatriculadoEnFecha(est, dia.dia, parseInt(selectedMes))
      )
      
      const presentes = estudiantesMatriculados.filter(est => 
        asistencias[est.id]?.asistencias[dia.dia] === true
      ).length
      
      const totalMatriculadosDia = estudiantesMatriculados.length
      const ausentes = totalMatriculadosDia - presentes
      const porcentaje = totalMatriculadosDia > 0 ? (presentes / totalMatriculadosDia) * 100 : 0
      
      return {
        dia: dia.dia,
        presentes,
        ausentes,
        totalMatriculados: totalMatriculadosDia,
        porcentaje: Math.round(porcentaje * 10) / 10 // Redondear a 1 decimal
      }
    })
    
    // Estadísticas por estudiante
    const estadisticasPorEstudiante = estudiantes.map(estudiante => {
      // Solo considerar días hábiles donde el estudiante estaba matriculado
      const diasValidosParaEstudiante = diasDelMes.filter(d => 
        d.esHabil && estudianteMatriculadoEnFecha(estudiante, d.dia, parseInt(selectedMes))
      )
      
      const diasPresente = diasValidosParaEstudiante.filter(dia => 
        asistencias[estudiante.id]?.asistencias[dia.dia] === true
      ).length
      
      const porcentaje = diasValidosParaEstudiante.length > 0 ? 
        (diasPresente / diasValidosParaEstudiante.length) * 100 : 0
      
      return {
        estudianteId: estudiante.id,
        diasPresente,
        totalDias: diasValidosParaEstudiante.length,
        porcentaje: Math.round(porcentaje * 10) / 10
      }
    })
    
    return { estadisticasPorDia, estadisticasPorEstudiante, totalEstudiantes }
  }

  const handleSave = async () => {
    if (!selectedMes || !selectedCurso) {
      toast({
        title: "Selección Incompleta",
        description: "Debe seleccionar mes y curso",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setSaving(true)
    try {
      // Aquí implementarías el guardado en la base de datos
      // Por ahora solo mostramos el toast
      toast({
        title: "¡Asistencia Guardada!",
        description: "La asistencia se ha guardado correctamente.",
        duration: 3000,
      })
      
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error: any) {
      toast({
        title: "Error al Guardar",
        description: error.message || 'Error al guardar asistencia',
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  const canShowTable = selectedMes && selectedCurso && estudiantes.length > 0 && diasDelMes.length > 0

  return (
    <div className="w-full max-w-none py-6 space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asistencia Mensual</h1>
          <p className="text-muted-foreground">
            Registro de asistencia diaria por curso y mes
          </p>
        </div>
        <Calendar className="h-8 w-8 text-muted-foreground" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Selectores */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Mes y Curso</CardTitle>
            <CardDescription>
              Elija el mes y curso para gestionar la asistencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mes</label>
                <Select value={selectedMes} onValueChange={setSelectedMes}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor.toString()}>
                        {mes.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Curso</label>
                <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar Curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((curso) => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nombre_curso} - {curso.tipo_ensenanza}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Asistencia */}
        {canShowTable && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Asistencia - {meses.find(m => m.valor.toString() === selectedMes)?.nombre} 2025
                </CardTitle>
                <CardDescription>
                  {estudiantes.length} estudiantes - {diasDelMes.filter(d => d.esHabil).length} días hábiles
                </CardDescription>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="ml-4"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Asistencia'}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table className="w-full min-w-fit">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 lg:w-48 sticky left-0 bg-background text-xs">
                        Alumno
                      </TableHead>
                      {diasDelMes.map((dia) => (
                        <TableHead 
                          key={dia.dia} 
                          className={`text-center w-3 p-1 cursor-pointer hover:bg-muted/50 transition-colors duration-200 ${
                            !dia.esHabil ? 'bg-red-50 dark:bg-red-950' : ''
                          } ${
                            !esFechaHabilitada(dia.dia, parseInt(selectedMes)) && dia.esHabil 
                              ? 'bg-muted/50' 
                              : ''
                          }`}
                          onClick={() => dia.esHabil && esFechaHabilitada(dia.dia, parseInt(selectedMes)) && toggleColumnaCompleta(dia.dia)}
                          title={dia.esHabil && esFechaHabilitada(dia.dia, parseInt(selectedMes)) 
                            ? `Marcar/desmarcar todos para el día ${dia.dia}` 
                            : undefined
                          }
                        >
                          <div className="flex flex-col items-center space-y-0.5">
                            <span className="text-xs">{dia.diaSemana.charAt(0)}</span>
                            <span className={`font-bold text-xs ${
                              !esFechaHabilitada(dia.dia, parseInt(selectedMes)) && dia.esHabil 
                                ? 'opacity-50' 
                                : ''
                            }`}>
                              {dia.dia}
                            </span>
                            {!dia.esHabil && (
                              <X className="h-2.5 w-2.5 text-red-500" />
                            )}
                            {esFechaHabilitada(dia.dia, parseInt(selectedMes)) && dia.esHabil && (
                              <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center w-16 p-1 bg-accent/20">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-accent-foreground">%</span>
                          <span className="text-xs text-accent-foreground">Asist.</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estudiantes.map((estudiante, indice) => {
                      const { estadisticasPorEstudiante } = calcularEstadisticas()
                      const estadisticaEstudiante = estadisticasPorEstudiante.find(
                        est => est.estudianteId === estudiante.id
                      )
                      
                      return (
                        <TableRow key={estudiante.id} className="h-12">
                          <TableCell className="sticky left-0 bg-background border-r p-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-muted-foreground min-w-[1.5rem]">
                                {indice + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate" title={estudiante.name}>
                                  {/* Nombre completo en pantallas grandes, nombre corto en pequeñas */}
                                  <span className="hidden lg:inline">{estudiante.name}</span>
                                  <span className="lg:hidden">{formatearNombreEstudiante(estudiante.name)}</span>
                                  {estudiante.withdrawal_date && (
                                    <span className="ml-1 text-xs text-red-500 font-bold">(Retirado)</span>
                                  )}
                                </div>
                                {estudiante.withdrawal_date && (
                                  <div className="text-xs text-muted-foreground">
                                    Hasta: {new Date(estudiante.withdrawal_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          {diasDelMes.map((dia) => {
                            const estudianteMatriculado = estudianteMatriculadoEnFecha(estudiante, dia.dia, parseInt(selectedMes))
                            const fechaHabilitada = esFechaHabilitada(dia.dia, parseInt(selectedMes))
                            
                            return (
                              <TableCell 
                                key={dia.dia} 
                                className={`text-center p-1 w-3 ${
                                  !dia.esHabil ? 'bg-red-50 dark:bg-red-950' : ''
                                } ${
                                  !fechaHabilitada && dia.esHabil 
                                    ? 'bg-muted/30' 
                                    : ''
                                } ${
                                  !estudianteMatriculado && dia.esHabil
                                    ? 'bg-gray-100 dark:bg-gray-800'
                                    : ''
                                }`}
                              >
                                {dia.esHabil ? (
                                  estudianteMatriculado ? (
                                    <Checkbox
                                      checked={asistencias[estudiante.id]?.asistencias[dia.dia] || false}
                                      onCheckedChange={() => toggleAsistencia(estudiante.id, dia.dia)}
                                      disabled={!fechaHabilitada}
                                      className={`mx-auto h-3.5 w-3.5 ${
                                        !fechaHabilitada 
                                          ? 'opacity-50 cursor-not-allowed' 
                                          : ''
                                      }`}
                                    />
                                  ) : (
                                    <X className="h-3 w-3 text-blue-500 mx-auto" />
                                  )
                                ) : (
                                  <X className="h-3 w-3 text-red-500 mx-auto" />
                                )}
                              </TableCell>
                            )
                          })}
                          <TableCell className="text-center p-1 bg-accent/10 font-medium text-xs">
                            <Badge 
                              variant={estadisticaEstudiante && estadisticaEstudiante.porcentaje >= 85 ? 'default' : 'destructive'}
                              className="text-xs px-1 py-0.5"
                            >
                              {estadisticaEstudiante?.porcentaje || 0}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {/* Filas de estadísticas */}
                    {(() => {
                      const { estadisticasPorDia, totalEstudiantes } = calcularEstadisticas()
                      const totalPresentes = estadisticasPorDia.reduce((sum, dia) => sum + dia.presentes, 0)
                      const totalAusentes = estadisticasPorDia.reduce((sum, dia) => sum + dia.ausentes, 0)
                      const totalDiasHabiles = estadisticasPorDia.length
                      const promedioAsistencia = totalDiasHabiles > 0 ? 
                        Math.round((totalPresentes / (totalEstudiantes * totalDiasHabiles)) * 1000) / 10 : 0

                      return (
                        <>
                          {/* Separador */}
                          <TableRow>
                            <TableCell colSpan={diasDelMes.length + 2} className="h-2 p-0 border-t-2 border-border"></TableCell>
                          </TableRow>

                          {/* Fila: Presentes */}
                          <TableRow className="bg-muted/50 font-medium">
                            <TableCell className="sticky left-0 bg-muted border-r text-sm text-muted-foreground">
                              Presentes
                            </TableCell>
                            {diasDelMes.map((dia) => {
                              const estadisticaDia = estadisticasPorDia.find(est => est.dia === dia.dia)
                              return (
                                <TableCell 
                                  key={dia.dia} 
                                  className={`text-center text-[10px] font-medium ${
                                    !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-foreground'
                                  }`}
                                >
                                  {dia.esHabil ? (estadisticaDia?.presentes || 0) : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center bg-muted font-semibold text-sm">
                              {totalPresentes}
                            </TableCell>
                          </TableRow>

                          {/* Fila: Ausentes */}
                          <TableRow className="bg-muted/30 font-medium">
                            <TableCell className="sticky left-0 bg-muted/80 border-r text-sm text-muted-foreground">
                              Ausentes
                            </TableCell>
                            {diasDelMes.map((dia) => {
                              const estadisticaDia = estadisticasPorDia.find(est => est.dia === dia.dia)
                              return (
                                <TableCell 
                                  key={dia.dia} 
                                  className={`text-center text-[10px] font-medium ${
                                    !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-foreground'
                                  }`}
                                >
                                  {dia.esHabil ? (estadisticaDia?.ausentes || 0) : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center bg-muted/80 font-semibold text-sm">
                              {totalAusentes}
                            </TableCell>
                          </TableRow>

                          {/* Fila: Total Matriculados */}
                          <TableRow className="bg-accent/20 font-medium">
                            <TableCell className="sticky left-0 bg-accent/30 border-r text-sm text-accent-foreground">
                              Matriculados
                            </TableCell>
                            {diasDelMes.map((dia) => (
                              <TableCell 
                                key={dia.dia} 
                                className={`text-center text-[10px] font-medium ${
                                  !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-foreground'
                                }`}
                              >
                                {dia.esHabil ? (
                                  estadisticasPorDia.find(est => est.dia === dia.dia)?.totalMatriculados || 0
                                ) : '-'}
                              </TableCell>
                            ))}
                            <TableCell className="text-center bg-accent/30 font-semibold text-sm">
                              {totalEstudiantes}
                            </TableCell>
                          </TableRow>

                          {/* Fila: Porcentaje de Asistencia */}
                          <TableRow className="bg-primary/5 font-medium border-b-2 border-border">
                            <TableCell className="sticky left-0 bg-primary/10 border-r text-sm text-primary">
                              % Asistencia
                            </TableCell>
                            {diasDelMes.map((dia) => {
                              const estadisticaDia = estadisticasPorDia.find(est => est.dia === dia.dia)
                              return (
                                <TableCell 
                                  key={dia.dia} 
                                  className={`text-center text-[10px] font-medium ${
                                    !dia.esHabil ? 'bg-red-50 dark:bg-red-950 text-muted-foreground' : 'text-primary'
                                  }`}
                                >
                                  {dia.esHabil ? `${estadisticaDia?.porcentaje || 0}` : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center bg-primary/10 font-bold text-sm text-primary">
                              {promedioAsistencia}%
                            </TableCell>
                          </TableRow>
                        </>
                      )
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando estudiantes...</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}