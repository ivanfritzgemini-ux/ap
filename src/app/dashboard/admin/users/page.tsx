import { UserManagementClient } from "@/components/dashboard/admin/user-management-client";
import { fetchUsers } from "@/lib/data";

export default async function UserManagementPage() {
  const users = await fetchUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Crear, editar y gestionar todos los usuarios en el sistema.
        </p>
      </div>
      <UserManagementClient users={users} />
    </div>
  );
}