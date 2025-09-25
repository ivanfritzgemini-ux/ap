"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Asignatura, Course, Teacher } from '@/lib/types'

interface AsignaturaForm {
  nombre: string;
  descripcion: string;
  curso_id: string;
  profesor_id: string;
}

export default function AsignaturasPage() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [cursos, setCursos] = useState<Course[]>([])
  const [profesores, setProfesores] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAsignatura, setEditingAsignatura] = useState<Asignatura | null>(null)
  const [formData, setFormData] = useState<AsignaturaForm>({
    nombre: '',
    descripcion: '',
    curso_id: '',
    profesor_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [asignaturasRes, cursosRes, profesoresRes] = await Promise.all([
        fetch('/api/asignaturas'),
        fetch('/api/cursos'),
        fetch('/api/teachers')
      ])

      if (!asignaturasRes.ok || !cursosRes.ok || !profesoresRes.ok) {
        throw new Error('Error al cargar los datos')
      }

      const [asignaturasData, cursosData, profesoresData] = await Promise.all([
        asignaturasRes.json(),
        cursosRes.json(),
        profesoresRes.json()
      ])

      setAsignaturas(asignaturasData.data || [])
      setCursos(cursosData.data || [])
      
      // Transformar profesores al formato esperado
      const profesoresFormatted = profesoresData.data?.map((p: any) => ({
        id: p.teacher_details?.id || p.id,
        nombre: p.name,
        email: p.email,
        especialidad: p.teacher_details?.especialidad
      })) || []
      
      setProfesores(profesoresFormatted)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (asignatura?: Asignatura) => {
    if (asignatura) {
      setEditingAsignatura(asignatura)
      setFormData({
        nombre: asignatura.nombre,
        descripcion: asignatura.descripcion || '',
        curso_id: asignatura.curso?.id || '',
        profesor_id: asignatura.profesor?.id || ''
      })
    } else {
      setEditingAsignatura(null)
      setFormData({
        nombre: '',
        descripcion: '',
        curso_id: '',
        profesor_id: ''
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nombre || !formData.curso_id || !formData.profesor_id) {
      toast({
        title: "Error",
        description: "El nombre, curso y profesor son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingAsignatura 
        ? `/api/asignaturas/${editingAsignatura.id}`
        : '/api/asignaturas'
      
      const method = editingAsignatura ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar la asignatura')
      }

      await loadData()
      setIsDialogOpen(false)
      
      toast({
        title: "Éxito",
        description: editingAsignatura 
          ? "Asignatura actualizada correctamente"
          : "Asignatura creada correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (asignatura: Asignatura) => {
    try {
      // Usar el ID de la asignatura (no el curso_asignatura_id)
      const response = await fetch(`/api/asignaturas/${asignatura.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la asignatura')
      }

      await loadData()
      toast({
        title: "Éxito",
        description: "Asignatura eliminada correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la asignatura",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando asignaturas...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asignaturas</h1>
          <p className="text-muted-foreground">
            Gestiona las asignaturas del establecimiento
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Asignatura
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAsignatura ? 'Editar Asignatura' : 'Nueva Asignatura'}
                </DialogTitle>
                <DialogDescription>
                  {editingAsignatura 
                    ? 'Modifica los datos de la asignatura'
                    : 'Completa los datos para crear una nueva asignatura'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Matemáticas"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción opcional de la asignatura"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Curso *</Label>
                  <Select 
                    value={formData.curso_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, curso_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.nombre_curso || curso.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profesor *</Label>
                  <Select 
                    value={formData.profesor_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, profesor_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un profesor" />
                    </SelectTrigger>
                    <SelectContent>
                      {profesores.map((profesor) => (
                        <SelectItem key={profesor.id} value={profesor.id}>
                          {profesor.nombre}
                          {profesor.especialidad && (
                            <span className="text-muted-foreground ml-2">
                              - {profesor.especialidad}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : (editingAsignatura ? 'Actualizar' : 'Crear')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lista de Asignaturas
          </CardTitle>
          <CardDescription>
            Total de asignaturas: {asignaturas.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {asignaturas.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">
                No hay asignaturas
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comienza creando una nueva asignatura
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Profesor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id}>
                    <TableCell className="font-medium">
                      {asignatura.nombre}
                    </TableCell>
                    <TableCell>
                      {asignatura.descripcion ? (
                        <span className="text-sm text-muted-foreground">
                          {asignatura.descripcion}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Sin descripción
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {asignatura.curso ? (
                        <Badge variant="secondary">
                          {asignatura.curso.nombre}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No asignado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {asignatura.profesor ? (
                        <div>
                          <div className="font-medium text-sm">
                            {asignatura.profesor.nombre}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {asignatura.profesor.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No asignado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(asignatura)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente
                                la asignatura "{asignatura.nombre}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(asignatura)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}