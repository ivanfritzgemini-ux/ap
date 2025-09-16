"use client";
import * as React from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, ArrowUpDown, Trash2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Course } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SortKey = keyof Course;

const initialNewCourseState = {
    name: "",
    // description removed
  teacher: "",
  nivel: "",
  letra: "",
  tipo_educacion_id: "",
  headTeacherId: ""
};

export function CourseManagementClient() {
    const { toast } = useToast();
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

    const [newCourse, setNewCourse] = React.useState(initialNewCourseState);
  const [teachersOptions, setTeachersOptions] = React.useState<{ id: string; name: string }[]>([]);
  const [teachingTypesOptions, setTeachingTypesOptions] = React.useState<{ id: string; name: string }[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
    const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Load courses from API and map to the `Course` shape
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/cursos')
        const json = await res.json()
        const rows = Array.isArray(json.data) ? json.data : []
        const mapped = rows.map((c: any) => ({
          id: String(c.id ?? ''),
          name: c.nombre_curso ?? c.name ?? ([c.nivel, c.letra].filter(Boolean).join(' ') || ''),
          teachingType: c.tipo_ensenanza ?? (Array.isArray(c.tipo_educacion) ? c.tipo_educacion[0]?.nombre : c.tipo_educacion?.nombre) ?? '',
          headTeacher: c.profesor_jefe ?? c.profesor_jefe_name ?? (c.profesor_jefe?.name ?? c.profesor_jefe ?? null) ?? '',
          studentCount: Number(c.alumnos ?? c.studentCount ?? 0)
        })) as Course[]
        if (!mounted) return
        // sort by name ascending (case-insensitive)
        mapped.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        setCourses(mapped)
      } catch (e) {
        setCourses([])
      }
    })()
    return () => { mounted = false }
  }, []);

  // Load teachers and teaching types to populate selects
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [tRes, tiposRes] = await Promise.all([
          fetch('/api/teachers'),
          fetch('/api/tipo-educacion')
        ])
        const tJson = await tRes.json()
        const tiposJson = await tiposRes.json()

        if (!mounted) return

  // Use profesores_detalles.id (teacher_details.id) as the select value because cursos.profesor_jefe_id references profesores_detalles.id
  const teachers = Array.isArray(tJson.data) ? tJson.data.map((t: any) => ({ id: String((t.teacher_details && t.teacher_details.id) ?? t.id ?? ''), name: t.name || `${t.nombres || ''} ${t.apellidos || ''}`.trim() })) : []
        setTeachersOptions(teachers)

        const tiposRaw = Array.isArray(tiposJson.data) ? tiposJson.data : []
        const tipos = tiposRaw.map((r: any) => ({ id: String(r.id), name: r.nombre }))
        setTeachingTypesOptions(tipos)
      } catch (e) {
        // ignore errors, leave options empty
      }
    })()
    return () => { mounted = false }
  }, [])

  React.useEffect(() => {
    if (!isDialogOpen) {
      setNewCourse(initialNewCourseState);
      setEditingCourseId(null);
    }
  }, [isDialogOpen]);
    
  const handleCreateCourse = async () => {
        // require at least nivel or name
        const composedName = [newCourse.nivel, newCourse.letra, newCourse.name].filter(Boolean).join(' ').trim();
        if (!composedName) {
            toast({ title: 'Error', description: 'Ingrese al menos nivel o nombre del curso.' });
            return;
        }

        setIsCreating(true);
        try {
          const payload = {
            nivel: newCourse.nivel || null,
            letra: newCourse.letra || null,
            nombre: newCourse.name || null,
            tipo_educacion_id: newCourse.tipo_educacion_id || null,
            profesor_jefe_id: newCourse.headTeacherId || null,
          }

          if (editingCourseId) {
            // When editing, only allow updating profesor_jefe_id per request
            const editPayload: any = {}
            if (payload.profesor_jefe_id !== undefined) editPayload.profesor_jefe_id = payload.profesor_jefe_id
            const res = await fetch(`/api/cursos/${editingCourseId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editPayload) })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al actualizar curso')
          } else {
            const res = await fetch('/api/cursos/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al crear curso')
          }

          // Refresh courses list from server to keep in sync
          try {
            const r = await fetch('/api/cursos')
            const j = await r.json()
            const rows = Array.isArray(j.data) ? j.data : []
            const mapped = rows.map((c: any) => ({
              id: String(c.id ?? ''),
              name: c.nombre_curso ?? c.name ?? ([c.nivel, c.letra].filter(Boolean).join(' ') || ''),
              teachingType: c.tipo_ensenanza ?? (Array.isArray(c.tipo_educacion) ? c.tipo_educacion[0]?.nombre : c.tipo_educacion?.nombre) ?? '',
              headTeacher: c.profesor_jefe ?? c.profesor_jefe_name ?? (c.profesor_jefe?.name ?? c.profesor_jefe ?? null) ?? '',
              studentCount: Number(c.alumnos ?? c.studentCount ?? 0)
            })) as Course[]
            mapped.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
            setCourses(mapped)
          } catch (e) {
            // if refresh fails, at least notify success
          }

          toast({ title: editingCourseId ? 'Curso Actualizado' : 'Curso Creado', description: editingCourseId ? `El curso "${composedName}" ha sido actualizado.` : `El curso "${composedName}" ha sido añadido exitosamente.` })
          setIsDialogOpen(false)
        } catch (err: any) {
          toast({ title: 'Error', description: err.message || (editingCourseId ? 'No se pudo actualizar el curso.' : 'No se pudo crear el curso.') })
        } finally {
          setIsCreating(false)
        }
    };

    const startEditingCourse = async (id: string) => {
      try {
        const res = await fetch(`/api/cursos/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'No se pudo cargar el curso')
        const data = json.data
        if (!data) throw new Error('Curso no encontrado')

        setNewCourse({
          name: data.nombre_curso ?? ([data.nivel, data.letra].filter(Boolean).join(' ') || ''),
          teacher: '',
          nivel: data.nivel ?? '',
          letra: data.letra ?? '',
          tipo_educacion_id: data.tipo_educacion_id ? String(data.tipo_educacion_id) : (data.tipo_educacion_id === null ? '' : ''),
          headTeacherId: data.profesor_jefe_id ? String(data.profesor_jefe_id) : (data.profesor_jefe_id === null ? '' : '')
        })
        setEditingCourseId(String(id))
        setIsDialogOpen(true)
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'No se pudo cargar el curso.' })
      }
    }

    const handleDeleteCourse = async (courseId: string) => {
      try {
        const res = await fetch(`/api/cursos/${courseId}`, { method: 'DELETE' })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || 'No se pudo eliminar el curso')
        }

        // remove from UI
        setCourses((prev) => prev.filter(c => c.id !== courseId))
        toast({ title: 'Curso Eliminado', description: 'El curso ha sido eliminado exitosamente.' })
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'No se pudo eliminar el curso.' })
      }
    };

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ? 
            <ArrowUpDown className="ml-2 h-4 w-4" /> : 
            <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.headTeacher.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedCourses = React.useMemo(() => {
        let sortableCourses = [...filteredCourses];
        if (sortConfig !== null) {
            sortableCourses.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableCourses;
    }, [filteredCourses, sortConfig]);

    const totalPages = Math.ceil(sortedCourses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCourses = sortedCourses.slice(indexOfFirstItem, indexOfLastItem);

    const handlePrevPage = () => {
      setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleNextPage = () => {
      setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setNewCourse(prev => ({ ...prev, [id]: value }));
    };

  const handleSelectChange = (id: string, value: string) => {
    setNewCourse(prev => ({ ...prev, [id]: value }));
  }

  const isEditMode = Boolean(editingCourseId)

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por curso o profesor..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 shrink-0 w-full md:w-auto">
                <PlusCircle className="h-3.5 w-3.5" />
                Añadir Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingCourseId ? 'Editar Curso' : 'Añadir Nuevo Curso'}</DialogTitle>
              <DialogDescription>
                {editingCourseId ? 'Modifique los detalles y guarde los cambios.' : 'Rellene los detalles para crear un nuevo curso.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="nivel" className="text-sm">Nivel</Label>
                  <Input id="nivel" placeholder="Ej: 1" value={newCourse.nivel} onChange={handleInputChange} disabled={isEditMode} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="letra" className="text-sm">Letra</Label>
                  <Input id="letra" placeholder="Ej: A" value={newCourse.letra} onChange={handleInputChange} disabled={isEditMode} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm">Nombre (opcional)</Label>
                  <Input id="name" placeholder="Álgebra" value={newCourse.name} onChange={handleInputChange} disabled={isEditMode} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="teachingType" className="text-sm">Tipo de Enseñanza</Label>
                  <Select value={newCourse.tipo_educacion_id} onValueChange={(v) => handleSelectChange('tipo_educacion_id', v)} disabled={isEditMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachingTypesOptions.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="headTeacherId" className="text-sm">Profesor Jefe</Label>
                  <Select value={newCourse.headTeacherId} onValueChange={(v) => handleSelectChange('headTeacherId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachersOptions.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" onClick={handleCreateCourse} disabled={isCreating}>{isCreating ? (editingCourseId ? 'Guardando...' : 'Creando...') : (editingCourseId ? 'Actualizar Curso' : 'Crear Curso')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg mt-4 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('name')}>
                  Nombre del Curso
                  {getSortIndicator('name')}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                 <Button variant="ghost" onClick={() => requestSort('teachingType')}>
                  Tipo de Enseñanza
                  {getSortIndicator('teachingType')}
                </Button>
              </TableHead>
              <TableHead>Profesor Jefe</TableHead>
              <TableHead className="text-right">Alumnos</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.name}</TableCell>
                <TableCell className="hidden md:table-cell">{course.teachingType}</TableCell>
                <TableCell>{course.headTeacher}</TableCell>
                <TableCell className="text-right">{course.studentCount}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/admin/courses/${course.id}/details`} className="flex items-center cursor-pointer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver Ficha
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => startEditingCourse(course.id)}>Editar</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-500 hover:text-red-500 focus:text-red-500">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el curso y sus datos de nuestros servidores.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <div className="grid gap-4 md:hidden mt-4">
        {currentCourses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base">{course.name}</span>
                 <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/courses/${course.id}/details`} className="flex items-center cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />
                                Ver Ficha
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => startEditingCourse(course.id)}>Editar</DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-500 hover:text-red-500 focus:text-red-500">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el curso y sus datos de nuestros servidores.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">Tipo:</span> {course.teachingType}</p>
              <p><span className="font-semibold">Profesor Jefe:</span> {course.headTeacher}</p>
              <p><span className="font-semibold">Alumnos:</span> {course.studentCount}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedCourses.length)} de {sortedCourses.length} cursos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </>
  );
}
