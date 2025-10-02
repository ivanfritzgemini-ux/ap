import { StudentList } from "@/components/dashboard/teacher/student-list";
import { getTeacherStudents } from "@/lib/data";

export default async function TeacherStudentsPage() {
  console.log("🔍 TeacherStudentsPage: Iniciando carga de estudiantes...");
  
  try {
    const students = await getTeacherStudents();
    console.log("📊 TeacherStudentsPage: Estudiantes obtenidos:", students.length);
    console.log("📋 TeacherStudentsPage: Primeros 3 estudiantes:", students.slice(0, 3));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-headline font-semibold">Mis Estudiantes</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Visualiza los estudiantes de tus cursos y asignaturas.
          </p>
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-500">
            Debug: {students.length} estudiantes cargados | {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        {students.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No se encontraron estudiantes
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Posibles causas:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>No tienes cursos asignados como profesor jefe</li>
                    <li>No tienes asignaturas asignadas</li>
                    <li>Los cursos no tienen estudiantes matriculados</li>
                  </ul>
                  <p className="mt-2">
                    <a href="/dashboard/teacher/students/debug" className="underline">
                      Ver página de debug detallada
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <StudentList students={students} />
        )}
      </div>
    );
  } catch (error) {
    console.error("❌ TeacherStudentsPage: Error cargando estudiantes:", error);
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-headline font-semibold">Mis Estudiantes</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Visualiza los estudiantes de tus cursos y asignaturas.
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar estudiantes
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Se produjo un error al obtener la lista de estudiantes.</p>
                <p className="mt-1 font-mono text-xs">{error instanceof Error ? error.message : String(error)}</p>
                <p className="mt-2">
                  <a href="/dashboard/teacher/students/debug" className="underline">
                    Ver página de debug detallada
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
