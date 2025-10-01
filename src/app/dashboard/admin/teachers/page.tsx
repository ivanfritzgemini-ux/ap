import { TeacherManagementClient } from "@/components/dashboard/admin/teacher-management-client";
import { requireAdmin } from "@/lib/auth";

export default async function TeacherManagementPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Gestión de Profesores</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Añadir, editar y gestionar todos los profesores en el sistema.
        </p>
      </div>
      <TeacherManagementClient />
    </div>
  );
}
