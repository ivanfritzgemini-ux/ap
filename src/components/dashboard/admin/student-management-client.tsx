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
import { users as mockUsers } from "@/lib/mock-data";
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
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SortKey = keyof User;

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
    registrationNumber: "",
    rut: "",
    lastName: "",
    name: "",
    sex: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    enrollmentDate: "",
    course: "",
    email: "",
    phone: "",
    address: ""
};

export function StudentManagementClient() {
    const { toast } = useToast();
    const [students, setStudents] = React.useState<User[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

    const [newStudent, setNewStudent] = React.useState(initialNewStudentState);

    React.useEffect(() => {
        setStudents(mockUsers.filter(u => u.role === 'student'));
    }, []);

     React.useEffect(() => {
        if (!isDialogOpen) {
            setNewStudent(initialNewStudentState);
        }
    }, [isDialogOpen]);

    const handleCreateStudent = () => {
        if (!newStudent.name.trim()) {
            return;
        }
        toast({
            title: "Estudiante Matriculado",
            description: `${newStudent.name} ha sido añadido exitosamente.`,
        });
        setIsDialogOpen(false);
    };

    const handleDeleteStudent = (studentId: string) => {
        setStudents(students.filter(student => student.id !== studentId));
        toast({
            title: "Estudiante Eliminado",
            description: "El estudiante ha sido eliminado exitosamente.",
        });
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rut?.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Buscar por nombre, RUT, o registro..."
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
              <DialogTitle>Matricular Estudiante</DialogTitle>
              <DialogDescription>
                Rellene los detalles para matricular un nuevo estudiante.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="registration-number">Número de Registro</Label>
                        <Input id="registration-number" value={newStudent.registrationNumber} onChange={handleInputChange} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="rut">RUT</Label>
                        <div className="flex gap-2">
                        <Input id="rut" value={newStudent.rut} onChange={handleInputChange} />
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Search className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="last-name">Apellidos</Label>
                            <Input id="lastName" placeholder="Ej: Pérez Díaz" value={newStudent.lastName} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombres</Label>
                            <Input id="name" placeholder="Ej: Juan" value={newStudent.name} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="sex">Sexo</Label>
                             <Select onValueChange={handleSelectChange('sex')} value={newStudent.sex}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione el sexo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="masculino">Masculino</SelectItem>
                                    <SelectItem value="femenino">Femenino</SelectItem>
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
                             <Input type="date" id="enrollmentDate" value={newStudent.enrollmentDate} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="course">Curso</Label>
                            <Select onValueChange={handleSelectChange('course')} value={newStudent.course}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un curso" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1a">1° Medio A</SelectItem>
                                    <SelectItem value="2c">2° Medio C</SelectItem>
                                    <SelectItem value="3b">3° Medio B - TP</SelectItem>
                                    <SelectItem value="4a">4° Medio A</SelectItem>
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
              <Button type="submit" onClick={handleCreateStudent}>Matricular Estudiante</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg mt-4 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">
                <Button variant="ghost" onClick={() => requestSort('registrationNumber')}>
                    N° Registro
                    {getSortIndicator('registrationNumber')}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">RUT</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('name')}>
                    Nombre del alumno
                    {getSortIndicator('name')}
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                 <Button variant="ghost" onClick={() => requestSort('gender')}>
                    Sexo
                    {getSortIndicator('gender')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('course')}>
                    Curso
                    {getSortIndicator('course')}
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
                <TableCell className="hidden sm:table-cell">{student.registrationNumber}</TableCell>
                <TableCell className="hidden md:table-cell">{student.rut}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell className="hidden lg:table-cell">{student.gender}</TableCell>
                <TableCell>{student.course}</TableCell>
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
                            <DropdownMenuItem>Editar</DropdownMenuItem>
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
                <span className="text-base">{student.name}</span>
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
                      <DropdownMenuItem>Editar</DropdownMenuItem>
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
              <p><span className="font-semibold">N° Registro:</span> {student.registrationNumber}</p>
              <p><span className="font-semibold">RUT:</span> {student.rut}</p>
              <p><span className="font-semibold">Curso:</span> {student.course}</p>
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
