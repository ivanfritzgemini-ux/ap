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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, ArrowUpDown, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Student } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"
import { parseISO, format as formatDateFn } from 'date-fns'

type SortKey = keyof Student;

const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const initialNewStudentState = {
    registration_number: "",
    rut: "",
    apellidos: "",
    nombres: "",
    sexo: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    enrollment_date: "",
    curso: "",
    email: "",
    phone: "",
    address: ""
};

interface StudentManagementClientProps {
  students: Student[];
}

export function StudentManagementClient({ students: initialStudents }: StudentManagementClientProps) {
    const { toast } = useToast();
  const [students, setStudents] = React.useState<Student[]>(initialStudents);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

    const [newStudent, setNewStudent] = React.useState(initialNewStudentState);
    const [editingStudentId, setEditingStudentId] = React.useState<string | null>(null);
  const [sexos, setSexos] = React.useState<Array<{id: string, nombre: string}>>([]);
  const [cursos, setCursos] = React.useState<Array<Record<string, any>>>([]);
  const rutRef = React.useRef<HTMLInputElement | null>(null);

  const buildCursoLabel = (c: Record<string, any>) => {
    if (!c) return ''
    // prefer tipo_educacion.nombre if available
    const tipoNombre = c?.tipo_educacion?.nombre ?? c.tipo_educacion ?? null
    let tipoLabel = tipoNombre ?? null
    if (typeof tipoLabel === 'string' && tipoLabel.includes('Media')) tipoLabel = 'Medio'

    const nivel = c.nivel ?? c.level ?? c.grade
    const letra = c.letra ?? c.letter

    if (nivel && tipoLabel && letra) return `${nivel}º ${tipoLabel} ${letra}`
    if (nivel && letra) return `${nivel}º ${letra}`
    // fallback to name fields
    const name = c.nombre_curso ?? c.nombre ?? c.name
    if (name && nivel && letra) return `${nivel}º ${letra} - ${name}`
    if (name) return name
    return String(c.id ?? '')
  }

     React.useEffect(() => {
        if (!isDialogOpen) {
            setNewStudent(initialNewStudentState);
            setEditingStudentId(null);
            return;
        }

        // when opening the dialog: if we're creating (not editing) fetch next registry
        if (!editingStudentId) {
          fetchLastRegistry();
        }

        (async () => {
          try {
            const [sexRes, cursosRes] = await Promise.all([fetch('/api/sexos'), fetch('/api/cursos')])
            const sexJson = await sexRes.json();
            const cursosJson = await cursosRes.json();
            setSexos(Array.isArray(sexJson.data) ? sexJson.data : [])
            setCursos(Array.isArray(cursosJson.data) ? cursosJson.data : [])
          } catch (e) {
            // ignore
          }
        })()
        // focus the RUT input after the dialog opens and elements mount
        requestAnimationFrame(() => rutRef.current?.focus());
    }, [isDialogOpen, editingStudentId]);

  const fetchLastRegistry = async () => {
    try {
      const res = await fetch('/api/students/last-registry');
      const json = await res.json();
      const last = json.last;
      // Try to increment numeric suffix if possible
      if (last) {
        const num = parseInt(String(last).replace(/\D/g, ''), 10);
        if (!isNaN(num)) {
          setNewStudent(prev => ({ ...prev, registration_number: String(num + 1) }));
          return;
        }
      }
      // fallback
      setNewStudent(prev => ({ ...prev, registration_number: '1' }));
    } catch (e) {
      setNewStudent(prev => ({ ...prev, registration_number: '1' }));
    }
  }

    const fetchList = async () => {
      try {
        const res = await fetch('/api/students/list')
        const json = await res.json()
        if (res.ok && Array.isArray(json.data)) setStudents(json.data)
      } catch (e) { /* ignore */ }
    }

    const startEditingStudent = async (id: string) => {
      try {
        const res = await fetch(`/api/students/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error fetching student')
        const d = json.data
        const u = d.usuarios
        setNewStudent(prev => ({
          ...prev,
          registration_number: d.nro_registro ?? prev.registration_number,
          rut: u?.rut ?? prev.rut,
          nombres: u?.nombres ?? prev.nombres,
          apellidos: u?.apellidos ?? prev.apellidos,
          email: u?.email ?? prev.email,
          phone: u?.telefono ?? prev.phone,
          address: u?.direccion ?? prev.address,
          enrollment_date: d.fecha_matricula ?? prev.enrollment_date,
          curso: d.curso_id ?? prev.curso,
          // parse fecha_nacimiento without timezone shift
          birthYear: ((): string => { const m = String(u?.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? m[1] : prev.birthYear })(),
          birthMonth: ((): string => { const m = String(u?.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? String(Number(m[2])) : prev.birthMonth })(),
          birthDay: ((): string => { const m = String(u?.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? String(Number(m[3])) : prev.birthDay })(),
          sexo: u?.sexo_id ?? prev.sexo
        }))
        setEditingStudentId(id)
        setIsDialogOpen(true)
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'No se pudo cargar el estudiante.' })
      }
    }

    const handleCreateStudent = async () => {
    if (!newStudent.nombres.trim() || !newStudent.apellidos.trim()) {
      toast({ title: 'Campos requeridos', description: 'Nombres y apellidos son obligatorios.'});
      return;
    }
    try {
      const payload = {
        rut: newStudent.rut,
        nombres: newStudent.nombres,
        apellidos: newStudent.apellidos,
        sexo_id: newStudent.sexo,
        email: newStudent.email,
        telefono: newStudent.phone,
        direccion: newStudent.address,
        fecha_nacimiento: newStudent.birthYear && newStudent.birthMonth && newStudent.birthDay ? `${newStudent.birthYear}-${String(newStudent.birthMonth).padStart(2,'0')}-${String(newStudent.birthDay).padStart(2,'0')}` : null,
        curso_id: newStudent.curso,
        nro_registro: newStudent.registration_number,
        fecha_matricula: newStudent.enrollment_date
      };

      if (editingStudentId) {
        // update
        const res = await fetch('/api/students/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingStudentId, ...payload }) })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error updating student')
        toast({ title: 'Estudiante Actualizado', description: `${newStudent.nombres} ha sido actualizado.` })
        await fetchList()
        setIsDialogOpen(false)
        setEditingStudentId(null)
        return
      }

      const res = await fetch('/api/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error creating student');

      toast({ title: 'Estudiante Matriculado', description: `${newStudent.nombres} ha sido añadido exitosamente.` });
      // refresh list from server (server returns ordered list)
      await fetchList()
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'No se pudo matricular el estudiante.' });
    }
  };

    const handleDeleteStudent = async (studentId: string) => {
        try {
          const res = await fetch('/api/students/delete', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: studentId }) })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Error deleting')
          await fetchList()
          toast({ title: 'Estudiante Eliminado', description: 'El estudiante ha sido eliminado exitosamente.' })
        } catch (e: any) {
          toast({ title: 'Error', description: e.message || 'No se pudo eliminar el estudiante.' })
        }
    };

        // --- Retiro (withdraw) flow ---
        const [withdrawDialogOpen, setWithdrawDialogOpen] = React.useState(false);
        const [withdrawStudentId, setWithdrawStudentId] = React.useState<string | null>(null);
        const [withdrawDate, setWithdrawDate] = React.useState<string>('');
        const [withdrawReason, setWithdrawReason] = React.useState<string>('');

        const openWithdrawFor = (id: string) => {
          setWithdrawStudentId(id);
          setWithdrawDate('');
          setWithdrawReason('');
          setWithdrawDialogOpen(true);
        }

        const submitWithdraw = async () => {
          if (!withdrawStudentId) return;
          if (!withdrawDate) {
            toast({ title: 'Fecha requerida', description: 'Por favor ingrese la fecha de retiro.' })
            return;
          }
          try {
            // optimistic update: mark student as retired locally so UI updates immediately
            setStudents(prev => prev.map(s => s.id === withdrawStudentId ? { ...s, fecha_retiro: withdrawDate, motivo_retiro: withdrawReason } : s));
            const res = await fetch('/api/students/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: withdrawStudentId, fecha_retiro: withdrawDate, motivo_retiro: withdrawReason }) })
            const json = await res.json();
            if (!res.ok) {
              // rollback optimistic update on error
              setStudents(prev => prev.map(s => s.id === withdrawStudentId ? { ...s, fecha_retiro: undefined, motivo_retiro: undefined } : s));
              throw new Error(json.error || 'Error al registrar retiro')
            }
            toast({ title: 'Estudiante Retirado', description: 'Se registró la fecha de retiro correctamente.' })
            setWithdrawDialogOpen(false);
            setWithdrawStudentId(null);
            // refresh list to ensure server-state consistency
            await fetchList();
          } catch (e: any) {
            toast({ title: 'Error', description: e.message || 'No se pudo retirar el estudiante.' })
          }
        }

    const filteredStudents = students.filter(student =>
        student.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment_date?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedStudents = React.useMemo(() => {
        let sortableStudents = [...filteredStudents];
        if (sortConfig !== null) {
            sortableStudents.sort((a, b) => {
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
        return sortableStudents;
    }, [filteredStudents, sortConfig]);

    const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentStudents = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);

    const handlePrevPage = () => {
      setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleNextPage = () => {
      setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
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

  const formatDate = (d?: string | null) => {
    if (!d) return '-'
    try {
      // parseISO can throw if invalid; format to dd/MM/yyyy
      const dt = parseISO(d)
      return formatDateFn(dt, 'dd/MM/yyyy')
    } catch (e) {
      return d
    }
  }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewStudent(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string) => (value: string) => {
        setNewStudent(prev => ({ ...prev, [id]: value }));
    };

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, RUT..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 shrink-0 w-full md:w-auto">
                <PlusCircle className="h-3.5 w-3.5" />
                Añadir Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingStudentId ? 'Editar Estudiante' : 'Matricular Estudiante'}</DialogTitle>
              <DialogDescription>
                {editingStudentId ? 'Modifique los detalles del estudiante.' : 'Rellene los detalles para matricular un nuevo estudiante.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="registration-number">Número de Registro</Label>
                        <Input id="registration-number" value={newStudent.registration_number} onChange={handleInputChange} readOnly={!!editingStudentId} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="rut">RUT</Label>
                        <div className="flex gap-2">
                        <Input id="rut" value={newStudent.rut} onChange={handleInputChange} ref={rutRef} />
            <Button variant="outline" size="icon" className="shrink-0" onClick={async () => {
              if (!newStudent.rut) return;
              try {
                const res = await fetch(`/api/students/by-rut?rut=${encodeURIComponent(newStudent.rut)}`)
                const json = await res.json();
                if (json.user) {
                  const u = json.user;
                  setNewStudent(prev => ({
                    ...prev,
                    nombres: u.nombres || prev.nombres,
                    apellidos: u.apellidos || prev.apellidos,
                    email: u.email || prev.email,
                    phone: u.telefono || prev.phone,
                    address: u.direccion || prev.address,
                    // fecha_nacimiento may be stored as YYYY-MM-DD; parse without using Date to avoid timezone shifts
                    birthYear: ((): string => {
                      const m = String(u.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/)
                      return m ? m[1] : prev.birthYear
                    })(),
                    birthMonth: ((): string => {
                      const m = String(u.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/)
                      return m ? String(Number(m[2])) : prev.birthMonth
                    })(),
                    birthDay: ((): string => {
                      const m = String(u.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/)
                      return m ? String(Number(m[3])) : prev.birthDay
                    })(),
                    sexo: u.sexo_id || prev.sexo
                  }))
                  toast({ title: 'Datos precargados', description: 'Se cargaron los datos desde la base de usuarios.' })
                } else {
                  toast({ title: 'No encontrado', description: 'No se encontró usuario con ese RUT. Complete los datos manualmente.' })
                }
              } catch (e) {
                toast({ title: 'Error', description: 'No se pudo buscar el RUT.' })
              }
            }}>
              <Search className="h-4 w-4" />
            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="last-name">Apellidos</Label>
                            <Input id="apellidos" placeholder="Ej: Pérez Díaz" value={newStudent.apellidos} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombres</Label>
                            <Input id="nombres" placeholder="Ej: Juan" value={newStudent.nombres} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="sex">Sexo</Label>
              <Select onValueChange={handleSelectChange('sexo')} value={newStudent.sexo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el sexo" />
                </SelectTrigger>
                <SelectContent>
                  {sexos.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Fecha de Nacimiento</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Select onValueChange={handleSelectChange('birthDay')} value={newStudent.birthDay}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Día" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {days.map(day => <SelectItem key={day} value={String(day)}>{day}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={handleSelectChange('birthMonth')} value={newStudent.birthMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={handleSelectChange('birthYear')} value={newStudent.birthYear}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Año" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="enrollment-date">Fecha de Matrícula</Label>
                             <Input type="date" id="enrollment_date" value={newStudent.enrollment_date} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="course">Curso</Label>
              <Select onValueChange={handleSelectChange('curso')} value={newStudent.curso}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map(c => <SelectItem key={c.id} value={c.id}>{buildCursoLabel(c)}</SelectItem>)}
                </SelectContent>
              </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="ejemplo@email.com" value={newStudent.email} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" placeholder="555-123-4567" value={newStudent.phone} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" placeholder="123 Calle Falsa, Ciudad" value={newStudent.address} onChange={handleInputChange} />
                    </div>
                </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateStudent}>{editingStudentId ? 'Actualizar Estudiante' : 'Matricular Estudiante'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retirar Estudiante</DialogTitle>
              <DialogDescription>Registre la fecha de retiro y el motivo. Esto marcará al estudiante como retirado.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="withdraw-date">Fecha de Retiro</Label>
                <Input id="withdraw-date" type="date" value={withdrawDate} onChange={(e) => setWithdrawDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="withdraw-reason">Motivo de Retiro</Label>
                <Textarea id="withdraw-reason" value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setWithdrawDialogOpen(false)}>Cancelar</Button>
              <Button onClick={submitWithdraw}>Registrar Retiro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg mt-4 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">
                <Button variant="ghost" onClick={() => requestSort('registration_number')}>
                    N° de Registro
                    {getSortIndicator('registration_number')}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button variant="ghost" onClick={() => requestSort('rut')}>
                    RUT
                    {getSortIndicator('rut')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('apellidos')}>
                    Nombre del Alumno
                    {getSortIndicator('apellidos')}
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                 <Button variant="ghost" onClick={() => requestSort('sexo')}>
                    Sexo
                    {getSortIndicator('sexo')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('curso')}>
                    Curso
                    {getSortIndicator('curso')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('enrollment_date')}>
                    Fecha de Matrícula
                    {getSortIndicator('enrollment_date')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('fecha_retiro' as keyof Student)}>
                  Fecha de Retiro
                  {/* No sort indicator by default for optional field */}
                </Button>
              </TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="hidden md:table-cell">{student.registration_number}</TableCell>
                <TableCell className="hidden md:table-cell">{student.rut}</TableCell>
                <TableCell className="font-medium flex items-center gap-2">
                  <span className={student.fecha_retiro ? 'line-through opacity-60' : ''}>{`${student.apellidos} ${student.nombres}`}</span>
                  {student.fecha_retiro ? <Badge variant="destructive">Retirado</Badge> : null}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{student.sexo}</TableCell>
                <TableCell>{student.curso}</TableCell>
                <TableCell>{formatDate(student.enrollment_date)}</TableCell>
                <TableCell>{formatDate(student.fecha_retiro)}</TableCell>
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
                            <DropdownMenuItem onSelect={() => startEditingStudent(student.id)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openWithdrawFor(student.id)} className="text-amber-600">Retirar</DropdownMenuItem>
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
                            <AlertDialogTitle>¿Estás absolutely seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al estudiante y sus datos de nuestros servidores.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>Continuar</AlertDialogAction>
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
        {currentStudents.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-base flex items-center gap-2">
                  <span className={student.fecha_retiro ? 'line-through opacity-60' : ''}>{`${student.apellidos} ${student.nombres}`}</span>
                  {student.fecha_retiro ? <Badge variant="destructive">Retirado</Badge> : null}
                </span>
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
                      <DropdownMenuItem onSelect={() => startEditingStudent(student.id)}>Editar</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openWithdrawFor(student.id)} className="text-amber-600">Retirar</DropdownMenuItem>
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
                        Esta acción no se puede deshacer. Esto eliminará permanentemente al estudiante y sus datos de nuestros servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">N° de Registro:</span> {student.registration_number}</p>
              <p><span className="font-semibold">RUT:</span> {student.rut}</p>
              <p><span className="font-semibold">Curso:</span> {student.curso}</p>
              <p><span className="font-semibold">Fecha de Matrícula:</span> {formatDate(student.enrollment_date)}</p>
              <p><span className="font-semibold">Fecha de Retiro:</span> {formatDate(student.fecha_retiro)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedStudents.length)} de {sortedStudents.length} estudiantes
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