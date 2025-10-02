import { StudentList } from "@/components/dashboard/teacher/student-list";

// Datos de prueba simulados
const mockStudents = [
  {
    id: "1",
    registration_number: "2024001",
    rut: "12.345.678-9",
    nombres: "Juan Carlos",
    apellidos: "Pérez González",
    curso: "8º A",
    sexo: "Masculino",
    enrollment_date: "2024-03-01",
    es_matricula_actual: true
  },
  {
    id: "2",
    registration_number: "2024002",
    rut: "98.765.432-1",
    nombres: "María José",
    apellidos: "López Silva",
    curso: "8º A",
    sexo: "Femenino",
    enrollment_date: "2024-03-01",
    es_matricula_actual: true
  },
  {
    id: "3",
    registration_number: "2023015",
    rut: "11.222.333-4",
    nombres: "Pedro Antonio",
    apellidos: "Rodríguez Muñoz",
    curso: "7º B",
    sexo: "Masculino",
    enrollment_date: "2023-03-01",
    es_matricula_actual: true
  },
  {
    id: "4",
    registration_number: "2023020",
    rut: "44.555.666-7",
    nombres: "Ana Sofía",
    apellidos: "Martínez Castro",
    curso: "7º B",
    sexo: "Femenino",
    enrollment_date: "2023-03-01",
    fecha_retiro: "2024-06-15",
    es_matricula_actual: false
  }
];

export default function MockStudentsPage() {
  console.log("🧪 MockStudentsPage: Usando datos simulados");
  console.log("📊 Datos de prueba:", mockStudents.length, "estudiantes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">
          Mis Estudiantes (Datos de Prueba)
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Esta página usa datos simulados para probar el componente StudentList.
        </p>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">
            🧪 Modo de Prueba Activado
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            Mostrando {mockStudents.length} estudiantes simulados para verificar que el componente funciona correctamente.
          </p>
          <div className="mt-2 space-x-4 text-sm">
            <a href="/dashboard/teacher/students" className="text-blue-600 underline">
              Ver página real
            </a>
            <a href="/dashboard/teacher/students/debug" className="text-blue-600 underline">
              Ver debug detallado
            </a>
          </div>
        </div>
      </div>
      
      <StudentList students={mockStudents} />
    </div>
  );
}