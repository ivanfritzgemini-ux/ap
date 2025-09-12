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
import { users as mockUsers } from "@/lib/data";
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

const initialNewUserState = {
    rut: "",
    lastName: "",
    firstName: "",
    gender: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    address: "",
    email: "",
    phone: "",
    role: ""
};

export function UserManagementClient() {
    const { toast } = useToast();
    const [users, setUsers] = React.useState<User[]>([]);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

    const [newUser, setNewUser] = React.useState(initialNewUserState);

    React.useEffect(() => {
        setUsers(mockUsers);
    }, []);

    React.useEffect(() => {
        if (!isDialogOpen) {
            setNewUser(initialNewUserState);
        }
    }, [isDialogOpen]);

    const handleCreateUser = () => {
        if (!newUser.firstName.trim()) {
            return;
        }
        toast({
            title: "Usuario Creado",
            description: `El usuario ${newUser.firstName} ha sido añadido exitosamente.`,
        });
        setIsDialogOpen(false);
    };

    const handleDeleteUser = (userId: string) => {
        setUsers(users.filter(user => user.id !== userId));
        toast({
            title: "Usuario Eliminado",
            description: "El usuario ha sido eliminado exitosamente.",
        });
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedUsers = React.useMemo(() => {
        let sortableUsers = [...filteredUsers];
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
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
        return sortableUsers;
    }, [filteredUsers, sortConfig]);

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

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
        setNewUser(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: string) => (value: string) => {
        setNewUser(prev => ({ ...prev, [id]: value }));
    };

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
                Añadir Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Rellene los detalles para crear una nueva cuenta de usuario.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="rut">RUT</Label>
                    <Input id="rut" placeholder="12.345.678-9" value={newUser.rut} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Apellidos</Label>
                        <Input id="lastName" placeholder="Pérez" value={newUser.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">Nombres</Label>
                        <Input id="firstName" value={newUser.firstName} onChange={handleInputChange} placeholder="Juan" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="gender">Sexo</Label>
                        <Select onValueChange={handleSelectChange('gender')} value={newUser.gender}>
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
                        <Label>Fecha de nacimiento</Label>
                        <div className="grid grid-cols-3 gap-2">
                           <Select onValueChange={handleSelectChange('birthDay')} value={newUser.birthDay}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Día" />
                                </SelectTrigger>
                                <SelectContent>
                                    {days.map(day => <SelectItem key={day} value={String(day)}>{day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={handleSelectChange('birthMonth')} value={newUser.birthMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={handleSelectChange('birthYear')} value={newUser.birthYear}>
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
                 <div className="grid gap-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" placeholder="Av. Siempre Viva 742" value={newUser.address} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input id="email" type="email" placeholder="juan.perez@ejemplo.com" value={newUser.email} onChange={handleInputChange}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="+56 9 1234 5678" value={newUser.phone} onChange={handleInputChange}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select onValueChange={handleSelectChange('role')} value={newUser.role}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="administrator">Administrador</SelectItem>
                            <SelectItem value="teacher">Profesor</SelectItem>
                            <SelectItem value="student">Estudiante</SelectItem>
                            <SelectItem value="parent">Padre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateUser}>Crear Usuario</Button>
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
              <TableHead className="hidden lg:table-cell">
                 <Button variant="ghost" onClick={() => requestSort('gender')}>
                    Sexo
                    {getSortIndicator('gender')}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Correo</TableHead>
              <TableHead>
                 <Button variant="ghost" onClick={() => requestSort('role')}>
                    Rol
                    {getSortIndicator('role')}
                </Button>
              </TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="hidden sm:table-cell">{user.rut}</TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="hidden lg:table-cell">{user.gender}</TableCell>
                <TableCell className="hidden md:table-cell">{user.email}</TableCell>
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
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario y sus datos de nuestros servidores.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Continuar</AlertDialogAction>
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
        {currentUsers.map((user) => (
            <Card key={user.id}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="text-base">{user.name}</span>
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
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario y sus datos de nuestros servidores.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Continuar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><span className="font-semibold">RUT:</span> {user.rut}</p>
                    <p><span className="font-semibold">Correo:</span> {user.email}</p>
                    <div className="flex items-center gap-2"><span className="font-semibold">Rol:</span> <Badge variant="outline">{user.role}</Badge></div>
                </CardContent>
            </Card>
        ))}
      </div>

       <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedUsers.length)} de {sortedUsers.length} usuarios
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
