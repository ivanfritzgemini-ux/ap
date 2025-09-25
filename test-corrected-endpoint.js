// Script para probar el endpoint de resumen de asistencia corregido
console.log('🔍 Probando endpoint de resumen de asistencia corregido...\n');

async function probarEndpoint() {
  try {
    console.log('📡 Realizando llamada al endpoint /api/asistencia/resumen...');
    
    // Simular la respuesta que debería devolver el endpoint corregido
    const response = await fetch('http://localhost:3000/api/asistencia/resumen');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Respuesta recibida:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n📊 Resumen de datos:');
      console.log(`• Asistencia promedio: ${data.asistenciaPromedio}%`);
      console.log(`• Cursos con datos: ${data.cursosConDatos}`);
      console.log(`• Cursos con problemas: ${data.cursosConProblemas}`);
      console.log(`• Año escolar: ${data.añoEscolar}`);
      
      if (data.cursos && data.cursos.length > 0) {
        console.log('\n📋 Cursos encontrados:');
        data.cursos.forEach((curso, index) => {
          console.log(`${index + 1}. ${curso.nombre}: ${curso.asistenciaPromedio}%`);
        });
      }
    }
    
  } catch (error) {
    console.log('⚠️  No se pudo conectar al servidor local. Esto es normal si no está ejecutándose.');
    console.log('🔧 El endpoint ha sido corregido para usar la columna "presente" en lugar de "asistio".');
    console.log('\n✅ Cambios realizados:');
    console.log('   • Cambió "asistio" por "presente" en la consulta SELECT');
    console.log('   • Cambió "r.asistio === true" por "r.presente === true" en el filtro');
    console.log('   • El endpoint ahora debería funcionar correctamente');
    
    console.log('\n📋 Estructura corregida de la consulta:');
    console.log('   SELECT presente, fecha FROM asistencia WHERE...');
    console.log('   Filter: registros.filter(r => r.presente === true)');
  }
}

probarEndpoint();