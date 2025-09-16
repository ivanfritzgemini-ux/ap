"use client";
import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, ArrowUpDown, Trash2 } from "lucide-react";
// data will be fetched from API where needed
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
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatRut } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SortKey = keyof User | 'name' | 'teacher_details';

const initialNewTeacherState = {
  rut: '',
  apellidos: '',
  nombres: '',
  sexo_id: '',
  fecha_nacimiento: '',
  fecha_contrato: '',
  numero_horas: '',
  especialidad: '',
  email: '',
  telefono: '',
  direccion: ''
};

export function TeacherManagementClient() {
    const { toast } = useToast();
  const [teachers, setTeachers] = React.useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

  const [newTeacher, setNewTeacher] = React.useState(initialNewTeacherState);
  const [editingTeacherId, setEditingTeacherId] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [sexos, setSexos] = React.useState<Array<{id:string,nombre:string}>>([]);
  const rutRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    // Load teachers from API (includes profesores_detalles)
    let mounted = true
    fetch('/api/teachers')
      .then((r) => r.json())
      .then((res) => {
        if (!mounted) return
        const rows = (res && res.data) ? res.data.map((t: any) => ({
          id: t.id,
          rut: t.rut,
          name: t.name || `${t.nombres || ''} ${t.apellidos || ''}`.trim(),
          email: t.email,
          gender: t.gender || '',
          role: t.role || '',
          teacher_details: t.teacher_details || null
        })) : []
        setTeachers(rows)
      })
      .catch((e) => {
        console.error('[teacher-management] failed to load teachers', e)
        setTeachers([])
      })

    return () => { mounted = false }
  }, []);

    React.useEffect(() => {
      if (!isDialogOpen) {
              setNewTeacher(initialNewTeacherState);
              return;
          }

      // when opening the dialog, fetch sexos similar to student modal
      (async () => {
        try {
          const res = await fetch('/api/sexos')
          const json = await res.json()
          setSexos(Array.isArray(json.data) ? json.data : [])
        } catch (e) {
          // ignore
        }
      })()

      // focus the RUT input after dialog opens
      requestAnimationFrame(() => rutRef.current?.focus());
    }, [isDialogOpen]);

    const handleCreateTeacher = async () => {
    if (!newTeacher.nombres.trim() && !newTeacher.apellidos.trim()) {
      toast({ title: 'Datos incompletos', description: 'Ingrese nombres o apellidos antes de crear.' });
      return;
    }

    try {
      const payload = {
        rut: newTeacher.rut,
        nombres: newTeacher.nombres,
        apellidos: newTeacher.apellidos,
        sexo_id: newTeacher.sexo_id,
        email: newTeacher.email,
        telefono: newTeacher.telefono,
        direccion: newTeacher.direccion,
        fecha_nacimiento: newTeacher.fecha_nacimiento,
        fecha_contrato: newTeacher.fecha_contrato,
        numero_horas: newTeacher.numero_horas,
        especialidad: newTeacher.especialidad
      }

      if (editingTeacherId) {
        // update
        const res = await fetch('/api/teachers/update', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: editingTeacherId, ...payload }) })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error updating teacher')
        toast({ title: 'Profesor Actualizado', description: `${newTeacher.nombres} ${newTeacher.apellidos} ha sido actualizado.` })
        setIsDialogOpen(false)
        setEditingTeacherId(null)
      } else {
        // create
        const res = await fetch('/api/teachers/create', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error creating teacher')
        toast({ title: 'Profesor Añadido', description: `${newTeacher.nombres} ${newTeacher.apellidos} ha sido añadido correctamente.` })
        setIsDialogOpen(false)
      }

      // refresh list
      try {
        const listRes = await fetch('/api/teachers')
        const listJson = await listRes.json()
        const rows = (listJson && listJson.data) ? listJson.data.map((t: any) => ({
          id: t.id,
          rut: t.rut,
          name: t.name || `${t.nombres || ''} ${t.apellidos || ''}`.trim(),
          email: t.email,
          gender: t.gender || '',
          role: t.role || '',
          teacher_details: t.teacher_details || null
        })) : []
        setTeachers(rows)
      } catch (e) {
        // ignore refresh error
      }

    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo crear/actualizar el profesor.' })
    }
    };

    const startEditingTeacher = async (id: string) => {
      try {
        const res = await fetch(`/api/teachers?id=${encodeURIComponent(id)}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error fetching teacher')

        // Normalize response: API may return { data: [...] } or { data: {...} } or the object directly
        let t: any = json?.data ?? json
        if (Array.isArray(t)) t = t[0] ?? null
        if (!t) throw new Error('Profesor no encontrado')

        // teacher_details may also come as an array from Supabase relations
        const rawDetails = t.teacher_details ?? null
        const details = Array.isArray(rawDetails) ? rawDetails[0] : rawDetails

        // normalize and fill form fields
        setNewTeacher(prev => ({
          ...prev,
          rut: t.rut || '',
          apellidos: t.apellidos || '',
          nombres: t.nombres || '',
          sexo_id: t.sexo_id ?? t.sexo ?? '',
          fecha_nacimiento: t.fecha_nacimiento ?? '',
          fecha_contrato: details?.fecha_contrato ?? '',
          numero_horas: details?.numero_horas ?? '',
          especialidad: details?.especialidad ?? '',
          email: t.email ?? '',
          telefono: t.telefono ?? '',
          direccion: t.direccion ?? ''
        }))
        setEditingTeacherId(id)
        setIsDialogOpen(true)
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'No se pudo cargar el profesor.' })
      }
    }

    const deleteTeacher = async (id: string) => {
      try {
        const res = await fetch('/api/teachers/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error deleting teacher')
        setTeachers(prev => prev.filter(t => t.id !== id))
        toast({ title: 'Profesor Eliminado', description: 'El profesor ha sido eliminado correctamente.' })
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'No se pudo eliminar el profesor.' })
      }
    }

    const handleDeleteTeacher = (teacherId: string) => {
        setTeachers(teachers.filter(teacher => teacher.id !== teacherId));
        toast({
            title: "Profesor Eliminado",
            description: "El profesor ha sido eliminado exitosamente.",
        });
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
        return <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedTeachers = React.useMemo(() => {
        let sortableTeachers = [...filteredTeachers];
        if (sortConfig !== null) {
            sortableTeachers.sort((a, b) => {
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
        return sortableTeachers;
    }, [filteredTeachers, sortConfig]);

    const totalPages = Math.ceil(sortedTeachers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTeachers = sortedTeachers.slice(indexOfFirstItem, indexOfLastItem);

    const handlePrevPage = () => {
      setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleNextPage = () => {
      setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewTeacher(prev => ({ ...prev, [id]: value }));
    };

  const handleSearchByRut = async () => {
    const rut = newTeacher.rut || '';
    if (!rut) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/students/by-rut?rut=${encodeURIComponent(rut)}`)
      const json = await res.json()
      const user = json?.user
      if (user) {
        setNewTeacher(prev => ({
          ...prev,
          apellidos: user.apellidos || prev.apellidos,
          nombres: user.nombres || prev.nombres,
          email: user.email || prev.email,
          telefono: user.telefono || prev.telefono,
          direccion: user.direccion || prev.direccion,
          sexo_id: user.sexo_id ?? prev.sexo_id,
          fecha_nacimiento: user.fecha_nacimiento ?? prev.fecha_nacimiento,
        }))
        toast({ title: 'Usuario encontrado', description: 'Se han rellenado los datos desde la base.' })
      } else {
        toast({ title: 'No encontrado', description: 'No se encontró usuario con ese RUT.' })
      }
    } catch (e) {
      console.error('search by rut failed', e)
      toast({ title: 'Error', description: 'No se pudo buscar por RUT.' })
    } finally {
      setIsSearching(false)
    }
  }


  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o correo..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 shrink-0 w-full md:w-auto">
                <PlusCircle className="h-3.5 w-3.5" />
                Añadir Profesor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingTeacherId ? 'Editar Profesor' : 'Añadir Nuevo Profesor'}</DialogTitle>
              <DialogDescription>
                {editingTeacherId ? 'Modifique los detalles del profesor.' : 'Rellene los detalles para crear una nueva cuenta de profesor.'}
              </DialogDescription>
            </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        <div className="space-y-6 min-w-0">
          <div className="grid gap-2">
            <Label htmlFor="rut" className="text-sm">RUT</Label>
            <div className="flex gap-3 items-center">
              <Input id="rut" placeholder="12.345.678-5" value={newTeacher.rut} onChange={handleInputChange} ref={rutRef} className="w-full min-w-0" />
              <Button variant="outline" size="icon" className="shrink-0" onClick={handleSearchByRut} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apellidos" className="text-sm">Apellidos</Label>
              <Input id="apellidos" value={newTeacher.apellidos} onChange={handleInputChange} className="w-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nombres" className="text-sm">Nombres</Label>
              <Input id="nombres" value={newTeacher.nombres} onChange={handleInputChange} className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sexo_id" className="text-sm">Sexo</Label>
              <Select onValueChange={(v) => setNewTeacher(prev => ({ ...prev, sexo_id: v }))} value={newTeacher.sexo_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el sexo" />
                </SelectTrigger>
                <SelectContent>
                  {sexos.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha_nacimiento" className="text-sm">Fecha de Nacimiento</Label>
              <Input id="fecha_nacimiento" type="date" value={newTeacher.fecha_nacimiento} onChange={handleInputChange} className="w-full" />
            </div>
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fecha_contrato" className="text-sm">Fecha de Contratación</Label>
              <Input id="fecha_contrato" type="date" value={newTeacher.fecha_contrato} onChange={handleInputChange} className="w-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="numero_horas" className="text-sm">Horas de Contrato</Label>
              <Input id="numero_horas" type="number" value={newTeacher.numero_horas} onChange={handleInputChange} className="w-full" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="especialidad" className="text-sm">Especialidad</Label>
            <Input id="especialidad" value={newTeacher.especialidad} onChange={handleInputChange} className="w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input id="email" type="email" value={newTeacher.email} onChange={handleInputChange} className="w-full" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefono" className="text-sm">Teléfono</Label>
              <Input id="telefono" value={newTeacher.telefono} onChange={handleInputChange} className="w-full" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="direccion" className="text-sm">Dirección</Label>
            <Input id="direccion" value={newTeacher.direccion} onChange={handleInputChange} className="w-full" />
          </div>
        </div>
      </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateTeacher}>{editingTeacherId ? 'Actualizar Profesor' : 'Crear Profesor'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg mt-4 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">RUT</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('name')}>
                    Nombre
                    {getSortIndicator('name')}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Género</TableHead>
              <TableHead className="hidden md:table-cell">Especialidad</TableHead>
              <TableHead className="hidden md:table-cell">Hrs</TableHead>
              <TableHead>Función</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTeachers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="hidden sm:table-cell">{formatRut(user.rut || '')}</TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="hidden md:table-cell">{user.gender}</TableCell>
                <TableCell className="hidden md:table-cell">{user.teacher_details?.especialidad ?? '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{user.teacher_details?.numero_horas ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
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
                            <DropdownMenuItem onSelect={() => startEditingTeacher(user.id)}>Editar</DropdownMenuItem>
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
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al profesor y sus datos de nuestros servidores.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTeacher(user.id)}>Continuar</AlertDialogAction>
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
        {currentTeachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base">{teacher.name}</span>
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
                        <DropdownMenuItem onSelect={() => startEditingTeacher(teacher.id)}>Editar</DropdownMenuItem>
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
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al profesor y sus datos de nuestros servidores.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTeacher(teacher.id)}>Continuar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">RUT:</span> {formatRut(teacher.rut || '')}</p>
              <p><span className="font-semibold">Género:</span> {teacher.gender}</p>
              {teacher.teacher_details ? (
                <>
                  <p><span className="font-semibold">Fecha Contrato:</span> {teacher.teacher_details.fecha_contrato ?? '-'}</p>
                  <p><span className="font-semibold">Especialidad:</span> {teacher.teacher_details.especialidad ?? '-'}</p>
                  <p><span className="font-semibold">Hrs:</span> {teacher.teacher_details.numero_horas ?? '-'}</p>
                </>
              ) : null}
              <div className="flex items-center gap-2"><span className="font-semibold">Función:</span> <Badge variant="outline">{teacher.role}</Badge></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedTeachers.length)} de {sortedTeachers.length} profesores
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
