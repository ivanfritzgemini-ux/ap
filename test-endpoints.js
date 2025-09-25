// Script simple para probar los endpoints de asistencia perfecta
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3000'; // Cambiar según el puerto
  
  console.log('🧪 Probando endpoints de asistencia perfecta...\n');
  
  // Probar diferentes meses
  const testCases = [
    { mes: '03', año: '2025', descripcion: 'Marzo 2025 (endpoint general)' },
    { mes: '04', año: '2025', descripcion: 'Abril 2025 (endpoint general)' },
    { mes: '05', año: '2025', descripcion: 'Mayo 2025 (endpoint general)' },
    { mes: '08', año: '2025', descripcion: 'Agosto 2025 (endpoint general)' },
    { mes: '09', año: '2025', descripcion: 'Septiembre 2025 (endpoint general)' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Probando: ${testCase.descripcion}`);
      console.log(`🔗 URL: /api/asistencia/perfecta?mes=${testCase.mes}&año=${testCase.año}`);
      
      const response = await fetch(`${baseUrl}/api/asistencia/perfecta?mes=${testCase.mes}&año=${testCase.año}`);
      
      if (!response.ok) {
        console.log(`❌ Error HTTP: ${response.status} - ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`✅ Respuesta exitosa:`);
      console.log(`   - Días hábiles: ${data.total_dias_habiles || 'N/A'}`);
      console.log(`   - Estudiantes con 100%: ${data.total || 0}`);
      
      if (data.estudiantes_perfectos && data.estudiantes_perfectos.length > 0) {
        console.log(`   - Nombres:`);
        data.estudiantes_perfectos.slice(0, 3).forEach((est, index) => {
          console.log(`     ${index + 1}. ${est.nombre} (${est.nombre_curso}) - ${est.dias_asistidos}/${est.total_dias_obligatorios} días`);
        });
        if (data.estudiantes_perfectos.length > 3) {
          console.log(`     ... y ${data.estudiantes_perfectos.length - 3} más`);
        }
      }
      
      if (data.message) {
        console.log(`   - Mensaje: ${data.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
    }
  }
  
  // Probar endpoint específico de marzo
  try {
    console.log(`\n📋 Probando: Marzo 2025 (endpoint específico)`);
    console.log(`🔗 URL: /api/dashboard/perfect-attendance-march`);
    
    const response = await fetch(`${baseUrl}/api/dashboard/perfect-attendance-march`);
    
    if (!response.ok) {
      console.log(`❌ Error HTTP: ${response.status} - ${response.statusText}`);
    } else {
      const data = await response.json();
      
      console.log(`✅ Respuesta exitosa:`);
      console.log(`   - Total estudiantes: ${data.totalStudents || 'N/A'}`);
      console.log(`   - Estudiantes con 100%: ${data.perfectAttendanceCount || 0}`);
      console.log(`   - Porcentaje: ${data.perfectAttendancePercentage || 'N/A'}%`);
      console.log(`   - Promedio general: ${data.averageAttendance || 'N/A'}%`);
      
      if (data.students && data.students.length > 0) {
        console.log(`   - Nombres:`);
        data.students.forEach((student, index) => {
          console.log(`     ${index + 1}. ${student.nombreCompleto} (${student.curso}) - ${student.diasPresente}/${student.diasRegistrados} días`);
        });
      }
    }
    
  } catch (error) {
    console.log(`❌ Error de conexión: ${error.message}`);
  }
  
  console.log('\n✅ Pruebas completadas');
};

// Solo ejecutar si se llama directamente
if (require.main === module) {
  testEndpoints().catch(console.error);
}

module.exports = { testEndpoints };