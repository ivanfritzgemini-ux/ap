import { getTeacherStudents } from "@/lib/data";

export default async function DebugTeacherStudentsPage() {
  console.log("🔍 Iniciando debug de getTeacherStudents...");
  
  try {
    const students = await getTeacherStudents();
    
    console.log("📊 Resultado de getTeacherStudents:");
    console.log("Número de estudiantes:", students.length);
    console.log("Datos completos:", JSON.stringify(students, null, 2));
    
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Debug: Estudiantes del Profesor</h1>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Información de Debug:</h2>
          <p><strong>Número de estudiantes:</strong> {students.length}</p>
          <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        </div>
        
        {students.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong>⚠️ No se encontraron estudiantes</strong>
            <p>Posibles causas:</p>
            <ul className="list-disc list-inside mt-2">
              <li>El usuario no está autenticado</li>
              <li>El usuario no es un profesor</li>
              <li>El profesor no tiene cursos asignados</li>
              <li>No hay estudiantes en los cursos del profesor</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong>✅ Se encontraron {students.length} estudiantes</strong>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.registration_number}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.rut}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.apellidos} {student.nombres}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.curso}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.es_matricula_actual ? 
                          <span className="text-green-600">✅ Sí</span> : 
                          <span className="text-red-600">❌ No</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <strong>🔗 Enlaces de navegación:</strong>
          <ul className="list-disc list-inside mt-2">
            <li><a href="/dashboard/teacher/students" className="underline">Ir a la página real de estudiantes</a></li>
            <li><a href="/dashboard/teacher" className="underline">Volver al dashboard del profesor</a></li>
          </ul>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error("❌ Error en getTeacherStudents:", error);
    
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Error en Debug</h1>
        
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>❌ Error al obtener estudiantes:</strong>
          <pre className="mt-2 text-sm">{error.message}</pre>
          <pre className="mt-2 text-xs">{error.stack}</pre>
        </div>
        
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>🔍 Pasos para diagnosticar:</strong>
          <ol className="list-decimal list-inside mt-2">
            <li>Verificar que estás logueado como profesor</li>
            <li>Verificar conexión a la base de datos</li>
            <li>Verificar que el usuario tiene rol de profesor</li>
            <li>Verificar las tablas profesores y asignaturas_profesor</li>
          </ol>
        </div>
      </div>
    );
  }
}