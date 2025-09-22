"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Save, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PeriodoAcademico {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

interface Curso {
  id: string
  nombre_curso: string
  tipo_ensenanza: string
  profesor_jefe: string
  alumnos: number
}

interface Asignatura {
  id: string
  nombre: string
  curso_asignatura_id?: string | null
}

interface Estudiante {
  id: string
  name: string
  registration_number: string
  enrollment_date: string
  withdrawal_date?: string
}

interface Calificacion {
  estudiante_id: string
  nota1: string
  nota2: string
  nota3: string
  nota4: string
  nota5: string
  nota6: string
  nota7: string
  nota8: string
  nota9: string
  nota10: string
  promedio: number
}

export default function CalificacionesPage() {
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('')
  const [selectedCurso, setSelectedCurso] = useState<string>('')
  const [selectedAsignatura, setSelectedAsignatura] = useState<string>('')
  
  const [calificaciones, setCalificaciones] = useState<Record<string, Calificacion>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  // Cargar períodos académicos al inicializar
  useEffect(() => {
    fetchPeriodos()
  }, [])

  // Cargar cursos cuando se selecciona un período
  useEffect(() => {
    if (selectedPeriodo) {
      fetchCursos()
      setSelectedCurso('')
      setSelectedAsignatura('')
      setEstudiantes([])
      setCalificaciones({})
    }
  }, [selectedPeriodo])

  // Cargar asignaturas cuando se selecciona un curso
  useEffect(() => {
    if (selectedCurso) {
      fetchAsignaturas()
      fetchEstudiantes()
      setSelectedAsignatura('')
      setCalificaciones({})
    }
  }, [selectedCurso])

  // Cargar calificaciones existentes cuando se selecciona asignatura
  useEffect(() => {
    if (selectedPeriodo && selectedCurso && selectedAsignatura && estudiantes.length > 0) {
      fetchCalificacionesExistentes()
    }
  }, [selectedAsignatura, estudiantes])

  // Inicializar calificaciones cuando se cargan estudiantes
  useEffect(() => {
    if (estudiantes.length > 0 && !selectedAsignatura) {
      const initialCalificaciones: Record<string, Calificacion> = {}
      estudiantes.forEach(estudiante => {
        initialCalificaciones[estudiante.id] = {
          estudiante_id: estudiante.id,
          nota1: '',
          nota2: '',
          nota3: '',
          nota4: '',
          nota5: '',
          nota6: '',
          nota7: '',
          nota8: '',
          nota9: '',
          nota10: '',
          promedio: 0
        }
      })
      setCalificaciones(initialCalificaciones)
    }
  }, [estudiantes, selectedAsignatura])

  const fetchPeriodos = async () => {
    try {
      const response = await fetch('/api/periodos-academicos')
      const result = await response.json()
      if (result.data) {
        setPeriodos(result.data)
      }
    } catch (error) {
      console.error('Error fetching períodos:', error)
      setError('Error al cargar períodos académicos')
    }
  }

  const fetchCursos = async () => {
    try {
      const response = await fetch('/api/cursos')
      const result = await response.json()
      if (result.data) {
        setCursos(result.data)
      }
    } catch (error) {
      console.error('Error fetching cursos:', error)
      setError('Error al cargar cursos')
    }
  }

  const fetchAsignaturas = async () => {
    try {
      // Intentar obtener asignaturas del curso específico
      const response = await fetch(`/api/curso-asignaturas?cursoId=${selectedCurso}`)
      const result = await response.json()
      
      if (result.data && result.data.length > 0) {
        setAsignaturas(result.data)
      } else {
        // Fallback: obtener todas las asignaturas si no hay asignaturas específicas del curso
        const fallbackResponse = await fetch('/api/asignaturas')
        const fallbackResult = await fallbackResponse.json()
        
        if (fallbackResult.data) {
          setAsignaturas(fallbackResult.data)
        } else {
          // Últimos recursos: asignaturas mockeadas
          const asignaturasMock: Asignatura[] = [
            { id: '1', nombre: 'Matemáticas' },
            { id: '2', nombre: 'Lenguaje' },
            { id: '3', nombre: 'Historia' },
            { id: '4', nombre: 'Ciencias' },
            { id: '5', nombre: 'Inglés' },
            { id: '6', nombre: 'Educación Física' },
            { id: '7', nombre: 'Arte' },
            { id: '8', nombre: 'Música' },
          ]
          setAsignaturas(asignaturasMock)
        }
      }
    } catch (error) {
      console.error('Error fetching asignaturas:', error)
      setError('Error al cargar asignaturas')
    }
  }

  const fetchEstudiantes = async () => {
    if (!selectedCurso) return
    
    setLoading(true)
    try {
      // Usar la nueva API específica para obtener estudiantes por curso
      const response = await fetch(`/api/students-by-course?courseId=${selectedCurso}`)
      const result = await response.json()
      
      if (result.data) {
        const estudiantesFormateados = result.data.map((est: any) => ({
          id: est.id,
          name: est.name,
          registration_number: est.registration_number,
          enrollment_date: est.enrollment_date,
          withdrawal_date: est.withdrawal_date
        }))
        
        setEstudiantes(estudiantesFormateados)
      }
    } catch (error) {
      console.error('Error fetching estudiantes:', error)
      setError('Error al cargar estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const fetchCalificacionesExistentes = async () => {
    try {
      const response = await fetch(
        `/api/calificaciones?periodoId=${selectedPeriodo}&cursoId=${selectedCurso}&asignaturaId=${selectedAsignatura}`
      )
      const result = await response.json()
      
      if (result.data && result.data.length > 0) {
        // Cargar calificaciones existentes
        const calificacionesExistentes: Record<string, Calificacion> = {}
        
        // Primero inicializar todos los estudiantes
        estudiantes.forEach(estudiante => {
          calificacionesExistentes[estudiante.id] = {
            estudiante_id: estudiante.id,
            nota1: '',
            nota2: '',
            nota3: '',
            nota4: '',
            nota5: '',
            nota6: '',
            nota7: '',
            nota8: '',
            nota9: '',
            nota10: '',
            promedio: 0
          }
        })
        
        // Luego llenar con datos existentes
        result.data.forEach((cal: any) => {
          if (calificacionesExistentes[cal.estudiante_id]) {
            // Las notas vienen como objeto JSON
            const notasData = cal.notas || {}
            
            calificacionesExistentes[cal.estudiante_id] = {
              estudiante_id: cal.estudiante_id,
              nota1: notasData.nota1 ? notasData.nota1.toString() : '',
              nota2: notasData.nota2 ? notasData.nota2.toString() : '',
              nota3: notasData.nota3 ? notasData.nota3.toString() : '',
              nota4: notasData.nota4 ? notasData.nota4.toString() : '',
              nota5: notasData.nota5 ? notasData.nota5.toString() : '',
              nota6: notasData.nota6 ? notasData.nota6.toString() : '',
              nota7: notasData.nota7 ? notasData.nota7.toString() : '',
              nota8: notasData.nota8 ? notasData.nota8.toString() : '',
              nota9: notasData.nota9 ? notasData.nota9.toString() : '',
              nota10: notasData.nota10 ? notasData.nota10.toString() : '',
              promedio: cal.promedio || 0
            }
          }
        })
        
        setCalificaciones(calificacionesExistentes)
      } else {
        // No hay calificaciones existentes, inicializar vacías
        const initialCalificaciones: Record<string, Calificacion> = {}
        estudiantes.forEach(estudiante => {
          initialCalificaciones[estudiante.id] = {
            estudiante_id: estudiante.id,
            nota1: '',
            nota2: '',
            nota3: '',
            nota4: '',
            nota5: '',
            nota6: '',
            nota7: '',
            nota8: '',
            nota9: '',
            nota10: '',
            promedio: 0
          }
        })
        setCalificaciones(initialCalificaciones)
      }
    } catch (error) {
      console.error('Error fetching calificaciones existentes:', error)
      // En caso de error, inicializar vacías
      const initialCalificaciones: Record<string, Calificacion> = {}
      estudiantes.forEach(estudiante => {
        initialCalificaciones[estudiante.id] = {
          estudiante_id: estudiante.id,
          nota1: '',
          nota2: '',
          nota3: '',
          nota4: '',
          nota5: '',
          nota6: '',
          nota7: '',
          nota8: '',
          nota9: '',
          nota10: '',
          promedio: 0
        }
      })
      setCalificaciones(initialCalificaciones)
    }
  }

  const formatearNotaFinal = (estudianteId: string, notaKey: string, value: string) => {
    if (value === '') return // Si está vacío, no formatear
    
    const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.')
    if (cleaned === '') return
    
    const num = parseFloat(cleaned)
    if (isNaN(num)) return
    
    let formattedValue: number
    
    if (num >= 10) {
      formattedValue = num / 10
    } else {
      formattedValue = num
    }
    
    // Solo formatear si está en rango válido
    if (formattedValue >= 1.0 && formattedValue <= 7.0) {
      setCalificaciones(prev => {
        const updated = {
          ...prev,
          [estudianteId]: {
            ...prev[estudianteId],
            [notaKey]: formattedValue.toFixed(1)
          }
        }
        
        // Recalcular promedio
        const notas = [
          updated[estudianteId].nota1,
          updated[estudianteId].nota2,
          updated[estudianteId].nota3,
          updated[estudianteId].nota4,
          updated[estudianteId].nota5,
          updated[estudianteId].nota6,
          updated[estudianteId].nota7,
          updated[estudianteId].nota8,
          updated[estudianteId].nota9,
          updated[estudianteId].nota10
        ].filter(nota => {
          if (nota === '') return false
          const num = parseFloat(nota)
          return !isNaN(num) && num >= 1.0 && num <= 7.0
        }).map(Number)
        
        const promedio = notas.length > 0 ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length : 0
        updated[estudianteId].promedio = Math.round(promedio * 10) / 10
        
        return updated
      })
    }
  }

  const updateNota = (estudianteId: string, notaKey: string, value: string) => {
    // Permitir cualquier entrada durante la edición
    setCalificaciones(prev => {
      const updated = {
        ...prev,
        [estudianteId]: {
          ...prev[estudianteId],
          [notaKey]: value
        }
      }
      
      // Calcular promedio automáticamente solo con notas válidas
      const notas = [
        updated[estudianteId].nota1,
        updated[estudianteId].nota2,
        updated[estudianteId].nota3,
        updated[estudianteId].nota4,
        updated[estudianteId].nota5,
        updated[estudianteId].nota6,
        updated[estudianteId].nota7,
        updated[estudianteId].nota8,
        updated[estudianteId].nota9,
        updated[estudianteId].nota10
      ].filter(nota => {
        if (nota === '') return false
        const num = parseFloat(nota.replace(',', '.'))
        return !isNaN(num) && num >= 1.0 && num <= 7.0
      }).map(nota => parseFloat(nota.replace(',', '.')))
      
      const promedio = notas.length > 0 ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length : 0
      updated[estudianteId].promedio = Math.round(promedio * 10) / 10
      
      return updated
    })
  }

  const handleSave = async () => {
    if (!selectedPeriodo || !selectedCurso || !selectedAsignatura) {
      setError('Debe seleccionar período, curso y asignatura')
      return
    }

    // Buscar la asignatura seleccionada para obtener el curso_asignatura_id
    const asignaturaSeleccionada = asignaturas.find(a => a.id === selectedAsignatura)
    let curso_asignatura_id = asignaturaSeleccionada?.curso_asignatura_id

    setSaving(true)
    setError('')
    
    try {
      // Si no hay curso_asignatura_id, crear la relación
      if (!curso_asignatura_id) {
        const relationResponse = await fetch('/api/curso-asignaturas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            curso_id: selectedCurso,
            asignatura_id: selectedAsignatura
          })
        })

        const relationResult = await relationResponse.json()
        if (relationResponse.ok) {
          curso_asignatura_id = relationResult.data.id
        } else {
          throw new Error(relationResult.error || 'Error al crear relación curso-asignatura')
        }
      }

      // Preparar datos para enviar
      const calificacionesData = Object.values(calificaciones).map(cal => ({
        periodo_id: selectedPeriodo,
        curso_id: selectedCurso,
        asignatura_id: selectedAsignatura,
        estudiante_id: cal.estudiante_id,
        notas: {
          nota1: cal.nota1 ? Number(cal.nota1) : null,
          nota2: cal.nota2 ? Number(cal.nota2) : null,
          nota3: cal.nota3 ? Number(cal.nota3) : null,
          nota4: cal.nota4 ? Number(cal.nota4) : null,
          nota5: cal.nota5 ? Number(cal.nota5) : null,
          nota6: cal.nota6 ? Number(cal.nota6) : null,
          nota7: cal.nota7 ? Number(cal.nota7) : null,
          nota8: cal.nota8 ? Number(cal.nota8) : null,
          nota9: cal.nota9 ? Number(cal.nota9) : null,
          nota10: cal.nota10 ? Number(cal.nota10) : null,
        },
        promedio: cal.promedio
      }))

      // Enviar a la API de calificaciones en lote
      const response = await fetch('/api/calificaciones/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calificaciones: calificacionesData })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`Calificaciones guardadas exitosamente. ${result.success} registros procesados.${result.errorCount > 0 ? ` ${result.errorCount} errores encontrados.` : ''}`)
        
        if (result.errorCount > 0) {
          console.log('Errores encontrados:', result.errors)
        }
      } else {
        throw new Error(result.error || 'Error al guardar calificaciones')
      }
      
    } catch (error: any) {
      console.error('Error saving calificaciones:', error)
      setError(error.message || 'Error al guardar calificaciones')
    } finally {
      setSaving(false)
    }
  }

  const canShowTable = selectedPeriodo && selectedCurso && selectedAsignatura && estudiantes.length > 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Ingreso de Notas</h1>
          <p className="text-muted-foreground">
            Gestiona las calificaciones de los estudiantes por período, curso y asignatura
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selección de Contexto</CardTitle>
          <CardDescription>
            Selecciona el semestre, curso y asignatura para ingresar las calificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Semestre */}
            <div className="space-y-2">
              <Label htmlFor="semestre">Seleccionar Semestre</Label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Semestre" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={periodo.id}>
                      {periodo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Curso */}
            <div className="space-y-2">
              <Label htmlFor="curso">Seleccionar Curso</Label>
              <Select 
                value={selectedCurso} 
                onValueChange={setSelectedCurso}
                disabled={!selectedPeriodo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nombre_curso}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Asignatura */}
            <div className="space-y-2">
              <Label htmlFor="asignatura">Seleccionar Asignatura</Label>
              <Select 
                value={selectedAsignatura} 
                onValueChange={setSelectedAsignatura}
                disabled={!selectedCurso}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar Asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {asignaturas.map((asignatura) => (
                    <SelectItem key={asignatura.id} value={asignatura.id}>
                      {asignatura.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {canShowTable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ingreso de Notas</CardTitle>
                <CardDescription>
                  Nómina de estudiantes - {estudiantes.length} estudiantes
                </CardDescription>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 Formato de Notas Chileno (1,0 - 7,0):</strong> Las notas se formatearán automáticamente al terminar de escribir. 
                Ejemplos: <span className="font-mono">43 → 4.3</span>, <span className="font-mono">57 → 5.7</span>, <span className="font-mono">7 → 7.0</span>. 
                Para eliminar una nota, borre todo el contenido del campo.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Estudiante</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 1</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 2</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 3</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 4</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 5</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 6</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 7</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 8</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 9</TableHead>
                    <TableHead className="w-[80px] text-center">Nota 10</TableHead>
                    <TableHead className="w-[100px] text-center">Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.map((estudiante) => {
                    const calificacion = calificaciones[estudiante.id]
                    const isWithdrawn = estudiante.withdrawal_date
                    
                    return (
                      <TableRow key={estudiante.id} className={isWithdrawn ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {estudiante.name}
                            {isWithdrawn && (
                              <Badge variant="secondary" className="text-xs">
                                Retirado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((notaNum) => (
                          <TableCell key={notaNum} className="text-center">
                            <Input
                              type="text"
                              value={calificacion?.[`nota${notaNum}` as keyof Calificacion] || ''}
                              onChange={(e) => updateNota(estudiante.id, `nota${notaNum}`, e.target.value)}
                              onBlur={(e) => formatearNotaFinal(estudiante.id, `nota${notaNum}`, e.target.value)}
                              className="w-16 text-center"
                              disabled={isWithdrawn}
                              placeholder="--"
                              title="Ingrese una nota de 1.0 a 7.0. Ejemplos: 43→4.3, 57→5.7, 7→7.0. Presione Backspace/Delete para eliminar."
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Badge 
                            variant={calificacion?.promedio >= 4.0 ? "default" : "destructive"}
                            className="font-mono"
                          >
                            {calificacion?.promedio > 0 ? calificacion.promedio.toFixed(1) : '--'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <p>Cargando estudiantes...</p>
        </div>
      )}
    </div>
  )
}