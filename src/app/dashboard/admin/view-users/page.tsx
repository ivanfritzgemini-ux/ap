
import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ViewUsersPage() {
  const supabase = createServerClient();
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-headline font-semibold">Error al Cargar Usuarios</h1>
        <p className="text-destructive">
          No se pudieron obtener los usuarios. Asegúrate de que las credenciales de Supabase son correctas y tienen los permisos necesarios.
        </p>
        <pre className="bg-muted p-4 rounded-md text-sm">{error.message}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-semibold">Usuarios Registrados en Supabase</h1>
        <p className="text-muted-foreground">
          Esta es una lista de todos los usuarios en tu instancia de Supabase Auth.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Un total de {users.length} usuarios encontrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID de Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha de Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
