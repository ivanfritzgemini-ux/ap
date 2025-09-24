"use client"
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarDays, Plus, Edit, Trash2 } from 'lucide-react'
import { z } from 'zod'

type DiaBloqueado = {
  id?: string
  curso_id?: string | null
  fecha: string
  resolucion: string
  motivo: string
  curso?: {
    id: string
    nivel: string
    letra: string
  }
}

type OpcionCurso = {
  id: string | null
  nivel: string | null
  letra: string | null
  label: string
  value: string
}

const diaBloqueadoSchema = z.object({
  curso_id: z.string().nullable(),
  fecha: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha inválida' }),
  resolucion: z.string().min(1, 'La resolución es obligatoria'),
  motivo: z.string().min(1, 'El motivo es obligatorio'),
})



export function DiasBloqueadosManagement({ diasBloqueados: initialDias }: { diasBloqueados: DiaBloqueado[] }) {
  const { toast } = useToast()
  const [diasBloqueados, setDiasBloqueados] = React.useState<DiaBloqueado[]>(initialDias ?? [])
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingDia, setEditingDia] = React.useState<DiaBloqueado | null>(null)
  const [form, setForm] = React.useState<Partial<DiaBloqueado>>({})
  const [loading, setLoading] = React.useState(false)

  // Estados para opciones de cursos
  const [opcionesCursos, setOpcionesCursos] = React.useState<OpcionCurso[]>([])
  const [loadingCursos, setLoadingCursos] = React.useState(false)

  // Confirmación de eliminación
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmTarget, setConfirmTarget] = React.useState<{ id: string, fecha: string } | null>(null)

  // Cargar datos iniciales
  React.useEffect(() => {
    loadDiasBloqueados()
    loadOpcionesCursos()
  }, [])

  const loadDiasBloqueados = async () => {
    try {
      const response = await fetch('/api/dias-bloqueados')
      const result = await response.json()
      if (response.ok) {
        setDiasBloqueados(result.data || [])
      }
    } catch (error) {
      console.error('Error loading dias bloqueados:', error)
    }
  }

  const loadOpcionesCursos = async () => {
    setLoadingCursos(true)
    try {
      const response = await fetch('/api/dias-bloqueados/cursos')
      const result = await response.json()
      if (response.ok && result.data) {
        setOpcionesCursos(result.data.opciones || [])
      }
    } catch (error) {
      console.error('Error loading opciones cursos:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar los cursos disponibles',
        variant: 'destructive'
      })
    } finally {
      setLoadingCursos(false)
    }
  }

  const openNewDia = () => {
    setEditingDia(null)
    setForm({
      curso_id: null,
      fecha: '',
      resolucion: '',
      motivo: '',
    })
    setModalOpen(true)
  }

  const openEditDia = (dia: DiaBloqueado) => {
    setEditingDia(dia)
    setForm({
      curso_id: dia.curso_id || null,
      fecha: dia.fecha,
      resolucion: dia.resolucion,
      motivo: dia.motivo,
    })
    setModalOpen(true)
  }

  const saveDia = async () => {
    const parsed = diaBloqueadoSchema.safeParse(form)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      toast({ 
        title: 'Error de validación', 
        description: firstError.message,
        variant: 'destructive' 
      })
      return
    }

    setLoading(true)
    try {
      const method = editingDia?.id ? 'PUT' : 'POST'
      const payload = editingDia?.id ? { ...parsed.data, id: editingDia.id } : parsed.data
      
      const response = await fetch('/api/dias-bloqueados', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar')
      }

      toast({ 
        title: editingDia ? 'Día actualizado' : 'Día bloqueado agregado', 
        description: 'Los cambios se guardaron correctamente.' 
      })
      
      setModalOpen(false)
      await loadDiasBloqueados()
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'No se pudo guardar',
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteDia = async (id: string) => {
    try {
      const response = await fetch(`/api/dias-bloqueados?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar')
      }

      toast({ 
        title: 'Día eliminado', 
        description: 'El día bloqueado fue eliminado correctamente.' 
      })
      
      await loadDiasBloqueados()
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'No se pudo eliminar',
        variant: 'destructive' 
      })
    }
  }

  const openConfirmDelete = (id: string, fecha: string) => {
    setConfirmTarget({ id, fecha })
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!confirmTarget) return
    setConfirmOpen(false)
    await deleteDia(confirmTarget.id)
  }

  const formatFecha = (fecha: string) => {
    try {
      // Agregar timezone para evitar problemas de zona horaria
      const fechaConTZ = new Date(fecha + 'T12:00:00')
      return fechaConTZ.toLocaleDateString('es-CL')
    } catch {
      return fecha
    }
  }

  const getDescripcionBloqueo = (dia: DiaBloqueado) => {
    if (!dia.curso_id) {
      return 'Todos los cursos'
    }
    
    if (dia.curso && dia.curso.nivel && dia.curso.letra) {
      return `${dia.curso.nivel}° Medio ${dia.curso.letra}`
    }
    
    // Fallback: buscar en opciones por curso_id
    const opcionEncontrada = opcionesCursos.find(op => op.id === dia.curso_id)
    if (opcionEncontrada) {
      return opcionEncontrada.label
    }
    
    return 'Curso específico'
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col md:flex-row items-start justify-between gap-4 w-full'>
          <div>
            <CardTitle className='text-lg md:text-xl flex items-center gap-2'>
              <CalendarDays className="h-5 w-5" />
              Días Bloqueados de Asistencia
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Gestiona los días específicos en que no se puede registrar asistencia para ciertos cursos.
              Los niveles y letras disponibles se cargan automáticamente desde los cursos existentes.
            </p>
          </div>
          <Button size='sm' onClick={openNewDia} className='inline-flex items-center gap-2'>
            <Plus className="h-4 w-4" />
            <span>Bloquear Día</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {diasBloqueados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay días bloqueados configurados</p>
            <p className="text-sm">Haz clic en "Bloquear Día" para agregar el primer bloqueo</p>
          </div>
        ) : (
          <div className='overflow-hidden rounded-md border'>
            <div className='grid grid-cols-12 gap-4 p-4 bg-muted/50 text-muted-foreground font-medium text-sm'>
              <div className='col-span-2'>Fecha</div>
              <div className='col-span-3'>Afecta a</div>
              <div className='col-span-2'>Resolución</div>
              <div className='col-span-3'>Motivo</div>
              <div className='col-span-2 text-right'>Acciones</div>
            </div>
            <div className='divide-y'>
              {diasBloqueados.map(dia => (
                <div key={dia.id} className='grid grid-cols-12 gap-4 p-4 items-center'>
                  <div className='col-span-2 font-medium'>
                    {formatFecha(dia.fecha)}
                  </div>
                  <div className='col-span-3 text-sm'>
                    {getDescripcionBloqueo(dia)}
                  </div>
                  <div className='col-span-2 text-sm font-medium'>
                    {dia.resolucion}
                  </div>
                  <div className='col-span-3 text-sm'>
                    {dia.motivo}
                  </div>
                  <div className='col-span-2 text-right flex justify-end gap-2'>
                    <Button 
                      size='sm' 
                      variant='outline' 
                      onClick={() => openEditDia(dia)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size='sm' 
                      variant='destructive' 
                      onClick={() => openConfirmDelete(dia.id!, dia.fecha)}
                      className="h-8 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal para crear/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDia ? 'Editar Día Bloqueado' : 'Bloquear Nuevo Día'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Curso Afectado</Label>
              <Select 
                value={form.curso_id || 'todos'} 
                onValueChange={(value) => {
                  setForm(prev => ({ 
                    ...prev, 
                    curso_id: value === 'todos' ? null : value 
                  }))
                }}
                disabled={loadingCursos}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCursos ? "Cargando cursos..." : "Seleccionar curso"} />
                </SelectTrigger>
                <SelectContent>
                  {opcionesCursos.map(curso => (
                    <SelectItem key={curso.value} value={curso.value}>
                      {curso.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Seleccione un curso específico o "Todos los cursos" para aplicar el bloqueo globalmente
              </p>
            </div>
            
            <div>
              <Label>Fecha</Label>
              <Input 
                type="date" 
                value={form.fecha || ''} 
                onChange={(e) => setForm(prev => ({ ...prev, fecha: e.target.value }))} 
              />
            </div>
            
            <div>
              <Label>Resolución que autoriza</Label>
              <Input 
                placeholder="Ej: Res. N° 123/2025" 
                value={form.resolucion || ''} 
                onChange={(e) => setForm(prev => ({ ...prev, resolucion: e.target.value }))} 
              />
            </div>
            
            <div>
              <Label>Motivo</Label>
              <Input 
                placeholder="Ej: Feriado nacional, Suspensión de clases, etc." 
                value={form.motivo || ''} 
                onChange={(e) => setForm(prev => ({ ...prev, motivo: e.target.value }))} 
              />
            </div>
            
            <div className='flex justify-end gap-2'>
              <Button 
                variant='outline' 
                onClick={() => setModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveDia} 
                disabled={loading}
              >
                {loading ? 'Guardando...' : (editingDia ? 'Actualizar' : 'Guardar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar el bloqueo para el día {confirmTarget?.fecha}? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}