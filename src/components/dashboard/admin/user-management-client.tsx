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
import { MoreHorizontal, PlusCircle, Search, ArrowUpDown, Trash2, Loader2, Edit } from "lucide-react";
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
import { formatRut } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

export function UserManagementClient({ users: initialUsers }: { users?: User[] }) {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<User[]>(initialUsers || []);
  const [loading, setLoading] = React.useState(false);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;

  const [newUser, setNewUser] = React.useState(initialNewUserState);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [roles, setRoles] = React.useState<Array<{id:string,nombre_rol:string}>>([])
  const [sexos, setSexos] = React.useState<Array<{id:string,nombre:string}>>([])

  React.useEffect(() => {
    if (!isDialogOpen) {
      setNewUser(initialNewUserState);
      setEditingUserId(null);
    }
  }, [isDialogOpen]);

  // Fetch users from API on mount
  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/users')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load users')
  if (mounted) setUsers((json.data || []).slice().sort((a: any, b: any) => (String(a.name || '').localeCompare(String(b.name || '')))))
        // fetch roles and sexos
        const [rolesRes, sexosRes] = await Promise.all([fetch('/api/roles'), fetch('/api/sexos')])
        const rolesJson = await rolesRes.json()
        const sexosJson = await sexosRes.json()
        if (rolesRes.ok) setRoles(rolesJson.data || [])
        if (sexosRes.ok) setSexos(sexosJson.data || [])
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'Error cargando usuarios' })
      } finally { setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  // When the search term changes, reset to the first page so results from all pages are visible
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleCreateUser = async () => {
    if (!newUser.firstName.trim()) return

    const payload = {
      rut: newUser.rut,
      nombres: newUser.firstName,
      apellidos: newUser.lastName,
      sexo_id: newUser.gender,
      email: newUser.email,
      telefono: newUser.phone,
      direccion: newUser.address,
      rol_id: newUser.role,
      fecha_nacimiento: `${newUser.birthYear}-${String(newUser.birthMonth).padStart(2,'0')}-${String(newUser.birthDay).padStart(2,'0')}`
    }

    setIsSubmitting(true)
    try {
      if (editingUserId) {
        // update flow
        const res = await fetch(`/api/users/${editingUserId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error updating user')
        setUsers(prev => {
          const updated = prev.map(u => (u.id === editingUserId ? json.data : u))
          updated.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')))
          const idx = updated.findIndex(u => u.id === editingUserId)
          if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1)
          return updated
        })
        toast({ title: 'Usuario Actualizado', description: `El usuario ${newUser.firstName} ha sido actualizado.` })
      } else {
        // Optimistic UI: insert a temporary user while request is pending
        const tempId = `temp-${Date.now()}`
        // try to map role and gender labels from the already-loaded caches
        const roleLabel = (roles.find(r => r.id === payload.rol_id) || { nombre_rol: 'Cargando...' }).nombre_rol;
        const genderLabel = (sexos.find(s => s.id === payload.sexo_id) || { nombre: null }).nombre;

        const optimisticUser: any = {
          id: tempId,
          rut: payload.rut,
          nombres: payload.nombres,
          apellidos: payload.apellidos,
          name: `${payload.apellidos || ''} ${payload.nombres || ''}`.trim(),
          email: payload.email,
          telefono: payload.telefono,
          direccion: payload.direccion,
          status: true,
          fecha_nacimiento: payload.fecha_nacimiento,
          sexo_id: payload.sexo_id,
          rol_id: payload.rol_id,
          // show mapped labels when possible so the optimistic row looks correct
          gender: genderLabel,
          role: roleLabel || 'Cargando...'
        }

        setUsers(prev => {
          const next = [optimisticUser, ...prev]
          next.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')))
          const idx = next.findIndex(u => u.id === optimisticUser.id)
          if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1)
          return next
        })

        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const json = await res.json()
        if (!res.ok) {
          // rollback optimistic
          setUsers(prev => prev.filter(u => u.id !== tempId))
          throw new Error(json?.error || 'Error creating user')
        }

        // Replace temp user with real one (or add if not found)
        setUsers(prev => {
          const found = prev.findIndex(u => u.id === tempId)
          if (found >= 0) {
            const next = prev.slice()
            next[found] = json.data
            next.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')))
            const idx = next.findIndex(u => u.id === json.data.id)
            if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1)
            return next
          }
          const next = [json.data, ...prev]
          next.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')))
          const idx = next.findIndex(u => u.id === json.data.id)
          if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1)
          return next
        })

        toast({ title: 'Usuario Creado', description: `El usuario ${newUser.firstName} ha sido añadido.` })
      }

      setIsDialogOpen(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo crear/actualizar el usuario' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (user: User) => {
    // fill modal with user info
    const usr: any = user
    // Try to use apellidos/nombres fields if available, otherwise split by last space
    let lastName = ''
    let firstName = ''
    if (usr.apellidos || usr.nombres) {
      lastName = usr.apellidos || ''
      firstName = usr.nombres || ''
    } else if (usr.name) {
      const parts = usr.name.trim().split(' ')
      if (parts.length === 1) {
        firstName = parts[0]
      } else {
        lastName = parts.slice(0, parts.length - 1).join(' ')
        firstName = parts[parts.length - 1]
      }
    }

    // parse fecha_nacimiento if present (YYYY-MM-DD)
    let birthDay = ''
    let birthMonth = ''
    let birthYear = ''
    if (usr.fecha_nacimiento) {
      const m = String(usr.fecha_nacimiento).match(/(\d{4})-(\d{2})-(\d{2})/)
      if (m) {
        birthYear = m[1]
        birthMonth = String(Number(m[2]))
        birthDay = String(Number(m[3]))
      }
    }

    // Prefer to use sexo_id and rol_id if available (they should be UUIDs)
    let genderVal: string = usr.sexo_id || ''
    let roleVal: string = usr.rol_id || ''

    // Fallback: try to map by label (match nombre/nombre_rol) or by substring
    if (!genderVal && usr.gender) {
      const found = sexos.find(s => s.nombre && String(s.nombre).toLowerCase() === String(usr.gender).toLowerCase())
      if (found) genderVal = found.id
      else {
        const found2 = sexos.find(s => s.nombre && String(usr.gender).toLowerCase().includes(String(s.nombre).toLowerCase()))
        if (found2) genderVal = found2.id
      }
    }

    if (!roleVal && usr.role) {
      const byExact = roles.find(r => r.nombre_rol && String(r.nombre_rol).toLowerCase() === String(usr.role).toLowerCase())
      if (byExact) roleVal = byExact.id
      else {
        const byContains = roles.find(r => r.nombre_rol && String(r.nombre_rol).toLowerCase().includes(String(usr.role).toLowerCase()))
        if (byContains) roleVal = byContains.id
      }
    }

    setNewUser({
      rut: usr.rut || '',
      lastName: lastName || '',
      firstName: firstName || '',
      gender: genderVal,
      birthDay,
      birthMonth,
      birthYear,
      address: usr.direccion || '',
      email: usr.email || '',
      phone: usr.telefono || '',
      role: roleVal
    })
    setEditingUserId(user.id)
    setIsDialogOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    // client-side guard: prevent deleting admin users even if UI somehow triggers
    const maybeUser = users.find(u => String(u.id) === String(userId))
    if (maybeUser) {
      const roleStr = String(maybeUser.role || '').toLowerCase()
      if (String(maybeUser.role || '').trim().toLowerCase().includes('admin')) {
        toast({ title: 'Acción no permitida', description: 'No se puede eliminar a un usuario con rol Administrador.' })
        return
      }
    }
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error deleting user')
      setUsers(prev => {
        const next = prev.filter(u => u.id !== userId)
        next.sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')))
        const totalPagesAfter = Math.max(1, Math.ceil(next.length / itemsPerPage))
        if (currentPage > totalPagesAfter) setCurrentPage(totalPagesAfter)
        return next
      })
      toast({ title: 'Usuario Eliminado', description: 'El usuario ha sido eliminado exitosamente.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo eliminar el usuario' })
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.rut ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig !== null) {
      sortableUsers.sort((a: any, b: any) => {
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
                    <Input id="rut" placeholder="12.345.678-9" value={newUser.rut} onChange={handleInputChange} disabled={isSubmitting} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Apellidos</Label>
                        <Input id="lastName" placeholder="Pérez" value={newUser.lastName} onChange={handleInputChange} disabled={isSubmitting} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">Nombres</Label>
                        <Input id="firstName" value={newUser.firstName} onChange={handleInputChange} placeholder="Juan" disabled={isSubmitting} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="gender">Sexo</Label>
            <Select onValueChange={handleSelectChange('gender')} value={newUser.gender} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el sexo" />
              </SelectTrigger>
              <SelectContent>
                {sexos.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Fecha de nacimiento</Label>
                        <div className="grid grid-cols-3 gap-2">
                           <Select onValueChange={handleSelectChange('birthDay')} value={newUser.birthDay} disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Día" />
                                </SelectTrigger>
                                <SelectContent>
                                    {days.map(day => <SelectItem key={day} value={String(day)}>{day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={handleSelectChange('birthMonth')} value={newUser.birthMonth} disabled={isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={handleSelectChange('birthYear')} value={newUser.birthYear} disabled={isSubmitting}>
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
                    <Input id="address" placeholder="Av. Siempre Viva 742" value={newUser.address} onChange={handleInputChange} disabled={isSubmitting} />
                </div>
              </div>
              <div className="space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input id="email" type="email" placeholder="juan.perez@ejemplo.com" value={newUser.email} onChange={handleInputChange} disabled={isSubmitting}/>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="+56 9 1234 5678" value={newUser.phone} onChange={handleInputChange} disabled={isSubmitting}/>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="role">Rol</Label>
          <Select onValueChange={handleSelectChange('role')} value={newUser.role} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre_rol}</SelectItem>)}
            </SelectContent>
          </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateUser} disabled={isSubmitting} className={isSubmitting ? 'opacity-70' : ''}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
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
            {loading && (
              // render 5 skeleton rows matching columns
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            )}

            {!loading && currentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="hidden sm:table-cell"><span className="block max-w-[10rem] truncate">{formatRut(user.rut || '')}</span></TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="hidden lg:table-cell">{user.gender}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {/* Inline buttons for md+ (desktop) */}
                      <div className="hidden md:flex items-center gap-2">
                        {/* Icon-only edit button */}
                        <Button size="icon-sm" variant="ghost" aria-label={`Editar ${user.name}`} onClick={() => handleEditClick(user)} className="p-0">
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Eliminar: NO mostrar la acción de eliminar si el usuario tiene rol Administrador */}
                        {!(String(user.role || '').trim().toLowerCase().includes('admin')) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="destructive" aria-label={`Eliminar ${user.name}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
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
                        )}
                      </div>

                      {/* Keep original dropdown for mobile (md:hidden -> visible on small screens) */}
                      <div className="md:hidden">
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon-sm" variant="ghost" className="p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>Editar</DropdownMenuItem>
                              {!(String(user.role || '').trim().toLowerCase().includes('admin')) && (
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-red-500 hover:text-red-500 focus:text-red-500">
                                    <Trash2 className="mr-2 h-4 w-4" />Eliminar
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              )}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden mt-4">
  {loading && (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={`card-skel-${i}`}>
              <CardHeader>
                <CardTitle><Skeleton className="h-4 w-40" /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))
        )}

    {!loading && currentUsers.map((user) => (
            <Card key={user.id}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="text-base">{user.name}</span>
                         <AlertDialog>
                            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon-sm" variant="ghost" className="p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditClick(user)}>Editar</DropdownMenuItem>
                                {!(String(user.role || '').trim().toLowerCase().includes('admin')) && (
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-red-500 hover:text-red-500 focus:text-red-500">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                )}
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
                    <p><span className="font-semibold">RUT:</span> <span className="inline-block max-w-[12rem] truncate align-middle">{formatRut(user.rut || '')}</span></p>
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