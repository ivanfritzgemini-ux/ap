import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowRightLeft, History, User, GraduationCap, Calendar, AlertTriangle } from "lucide-react"

interface Student {
  id: string
  nombres: string
  apellidos: string
  rut: string
  nro_registro: string
  curso_actual: {
    id: string
    nombre: string
  } | null
}

interface Course {
  id: string
  nombre: string
  nivel: string
  letra: string
  tipo_educacion?: string
  alumnos_activos: number
}

interface HistorialCambio {
  id: string
  fecha_evento: string
  tipo_evento: 'Matrícula' | 'Retiro'
  curso_nombre: string
  motivo: string
  es_actual: boolean
  fecha_matricula: string
  fecha_retiro?: string
}

interface ChangeCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  onSuccess: () => void
}

const motivosComunes = [
  'Repetición de curso',
  'Promoción de curso', 
  'Cambio por rendimiento académico',
  'Solicitud de apoderado',
  'Traslado interno',
  'Cambio de modalidad (HC a TP)',
  'Reorganización administrativa',
  'Otro'
]

export function ChangeCourseDialog({ open, onOpenChange, student, onSuccess }: ChangeCourseDialogProps) {
  const { toast } = useToast()
  const [courses, setCourses] = React.useState<Course[]>([])
  const [historial, setHistorial] = React.useState<HistorialCambio[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showHistorial, setShowHistorial] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    nuevo_curso_id: '',
    fecha_cambio: new Date().toISOString().split('T')[0],
    motivo_cambio: '',
    motivo_personalizado: '',
    observaciones: ''
  })

  // Cargar cursos disponibles
  React.useEffect(() => {
    if (open) {
      fetchCourses()
      if (student?.id) {
        fetchHistorial()
      }
    }
  }, [open, student])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/cursos')
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setCourses(json.data.map((c: any) => ({
          id: c.id,
          nombre: c.nombre_curso || `${c.nivel || ''} ${c.letra || ''}`.trim(),
          nivel: c.nivel || '',
          letra: c.letra || '',
          tipo_educacion: c.tipo_ensenanza || '',
          alumnos_activos: c.alumnos || 0
        })))
      }
    } catch (error) {
      console.error('Error cargando cursos:', error)
    }
  }

  const fetchHistorial = async () => {
    if (!student?.id) return
    
    try {
      const res = await fetch(`/api/students/change-course?estudiante_id=${student.id}`)
      const json = await res.json()
      if (res.ok && Array.isArray(json.data)) {
        setHistorial(json.data)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    }
  }

  const handleSubmit = async () => {
    if (!student || !formData.nuevo_curso_id || !formData.fecha_cambio) {
      toast({
        title: "Error de Validación",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    const motivoFinal = formData.motivo_cambio === 'Otro' 
      ? formData.motivo_personalizado 
      : formData.motivo_cambio

    if (!motivoFinal) {
      toast({
        title: "Error de Validación", 
        description: "Por favor seleccione o ingrese un motivo",
        variant: "destructive"
      })
      return
    }

    setShowConfirm(true)
  }

  const executeChange = async () => {
    setLoading(true)
    setShowConfirm(false)

    try {
      const motivoFinal = formData.motivo_cambio === 'Otro' 
        ? formData.motivo_personalizado 
        : formData.motivo_cambio

      const payload = {
        estudiante_id: student!.id,
        nuevo_curso_id: formData.nuevo_curso_id,
        fecha_cambio: formData.fecha_cambio,
        motivo_cambio: motivoFinal,
        observaciones: formData.observaciones
      }

      const res = await fetch('/api/students/change-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()

      if (res.ok) {
        toast({
          title: "Cambio de Curso Exitoso",
          description: `${student!.nombres} ${student!.apellidos} ha sido cambiado de curso`,
        })
        
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        throw new Error(json.error || 'Error desconocido')
      }

    } catch (error: any) {
      console.error('Error en cambio de curso:', error)
      toast({
        title: "Error en Cambio de Curso",
        description: error.message || 'Error inesperado al cambiar curso',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nuevo_curso_id: '',
      fecha_cambio: new Date().toISOString().split('T')[0],
      motivo_cambio: '',
      motivo_personalizado: '',
      observaciones: ''
    })
  }

  const selectedCourse = courses.find(c => c.id === formData.nuevo_curso_id)
  const currentCourseId = student?.curso_actual?.id
  const isCurrentCourse = formData.nuevo_curso_id === currentCourseId

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Cambio de Curso
            </DialogTitle>
            <DialogDescription>
              Realizar cambio de curso registrando retiro del curso actual y nueva matrícula en curso destino
            </DialogDescription>
          </DialogHeader>

          {student && (
            <div className="space-y-6">
              {/* Información del Estudiante */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    Información del Estudiante
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nombre:</span> {student.nombres} {student.apellidos}
                    </div>
                    <div>
                      <span className="font-medium">RUT:</span> {student.rut}
                    </div>
                    <div>
                      <span className="font-medium">N° Registro:</span> {student.nro_registro}
                    </div>
                    <div>
                      <span className="font-medium">Curso Actual:</span> 
                      <Badge variant="secondary" className="ml-2">
                        {student.curso_actual?.nombre || 'Sin curso asignado'}
                      </Badge>
                    </div>
                  </div>
                  
                  {historial.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowHistorial(!showHistorial)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      {showHistorial ? 'Ocultar' : 'Ver'} Historial ({historial.length})
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Historial de Cambios */}
              {showHistorial && historial.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Historial de Matrículas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {historial.map((h, index) => (
                        <div key={h.id} className={`border-l-2 pl-4 pb-3 ${
                          h.es_actual ? 'border-green-400' : 'border-gray-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Calendar className="h-3 w-3" />
                              {new Date(h.fecha_evento).toLocaleDateString('es-CL')}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={h.tipo_evento === 'Matrícula' ? 'default' : 'secondary'}>
                                {h.tipo_evento}
                              </Badge>
                              {h.es_actual && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  Actual
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <div><strong>Curso:</strong> {h.curso_nombre}</div>
                            <div><strong>Detalle:</strong> {h.motivo}</div>
                            <div className="text-xs mt-1">
                              Matrícula: {new Date(h.fecha_matricula).toLocaleDateString('es-CL')}
                              {h.fecha_retiro && (
                                <span> • Retiro: {new Date(h.fecha_retiro).toLocaleDateString('es-CL')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulario de Cambio */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4" />
                    Datos del Cambio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nuevo_curso">Nuevo Curso *</Label>
                      <Select 
                        value={formData.nuevo_curso_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, nuevo_curso_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar curso destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses
                            .filter(c => c.id !== currentCourseId) // Excluir curso actual
                            .map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{course.nombre}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({course.alumnos_activos} estudiantes)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isCurrentCourse && (
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Este es el curso actual del estudiante
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_cambio">Fecha del Cambio *</Label>
                      <Input
                        type="date"
                        id="fecha_cambio"
                        value={formData.fecha_cambio}
                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_cambio: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Motivo del Cambio *</Label>
                    <Select 
                      value={formData.motivo_cambio}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, motivo_cambio: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {motivosComunes.map(motivo => (
                          <SelectItem key={motivo} value={motivo}>
                            {motivo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.motivo_cambio === 'Otro' && (
                    <div className="space-y-2">
                      <Label htmlFor="motivo_personalizado">Especificar Motivo *</Label>
                      <Input
                        id="motivo_personalizado"
                        value={formData.motivo_personalizado}
                        onChange={(e) => setFormData(prev => ({ ...prev, motivo_personalizado: e.target.value }))}
                        placeholder="Ingrese el motivo específico"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                      placeholder="Información adicional sobre el cambio (opcional)"
                      rows={3}
                    />
                  </div>

                  {/* Información del curso seleccionado */}
                  {selectedCourse && (
                    <div className="p-3 bg-blue-50 rounded-md border">
                      <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-1">Curso Destino:</div>
                        <div className="text-blue-800">
                          <span className="font-medium">{selectedCourse.nombre}</span>
                          {selectedCourse.tipo_educacion && (
                            <span className="ml-2 text-xs">({selectedCourse.tipo_educacion})</span>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Estudiantes actuales: {selectedCourse.alumnos_activos}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !formData.nuevo_curso_id || isCurrentCourse}
            >
              {loading ? 'Procesando...' : 'Cambiar Curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cambio de Curso</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>¿Está seguro de realizar el siguiente cambio de curso?</p>
              
              {student && selectedCourse && (
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Estudiante:</strong> {student.nombres} {student.apellidos}</div>
                  <div><strong>Curso Actual:</strong> {student.curso_actual?.nombre || 'Sin curso'}</div>
                  <div><strong>Curso Nuevo:</strong> {selectedCourse.nombre}</div>
                  <div><strong>Fecha:</strong> {new Date(formData.fecha_cambio).toLocaleDateString('es-CL')}</div>
                  <div><strong>Motivo:</strong> {formData.motivo_cambio === 'Otro' ? formData.motivo_personalizado : formData.motivo_cambio}</div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Esta acción registrará al estudiante como retirado del curso actual y creará una nueva matrícula en el curso destino. Se mantendrá el historial completo.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeChange} disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Cambio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}