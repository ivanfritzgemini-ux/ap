import { CourseManagementClient } from "@/components/dashboard/admin/course-management-client";

export default function CourseManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Gestión de Cursos</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Añadir, editar y gestionar todos los cursos en el sistema.
        </p>
      </div>
      <CourseManagementClient />
    </div>
  );
}
