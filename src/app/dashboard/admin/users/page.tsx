import { UserManagementClient } from "@/components/dashboard/admin/user-management-client";

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Crear, editar y gestionar todos los usuarios en el sistema.
        </p>
      </div>
      <UserManagementClient />
    </div>
  );
}
