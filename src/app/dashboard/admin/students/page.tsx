import { StudentManagementClient } from "@/components/dashboard/admin/student-management-client";

export default function StudentManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Gestión de Estudiantes</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Añadir, editar y gestionar todos los estudiantes en el sistema.
        </p>
      </div>
      <StudentManagementClient />
    </div>
  );
}
