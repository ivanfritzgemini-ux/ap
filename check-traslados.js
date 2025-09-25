// Script para verificar estudiantes con traslados
console.log('Verificando estudiantes con datos de traslado...\n');

// Simulamos una consulta a la API
fetch('http://localhost:9001/api/students/list')
  .then(response => response.json())
  .then(data => {
    if (data.data && Array.isArray(data.data)) {
      const estudiantes = data.data;
      console.log(`Total de estudiantes encontrados: ${estudiantes.length}\n`);
      
      // Buscar estudiantes con traslados
      const conTraslados = estudiantes.filter(e => 
        e.tiene_traslado || 
        (e.motivo_retiro && (
          e.motivo_retiro.toLowerCase().includes('traslado') ||
          e.motivo_retiro.toLowerCase().includes('cambio de curso')
        ))
      );
      
      console.log(`Estudiantes con historial de traslado: ${conTraslados.length}`);
      
      if (conTraslados.length > 0) {
        console.log('\nDetalles de estudiantes con traslado:');
        conTraslados.forEach((e, i) => {
          console.log(`${i+1}. ${e.apellidos}, ${e.nombres}`);
          console.log(`   - Curso: ${e.curso}`);
          console.log(`   - Tiene traslado: ${e.tiene_traslado ? 'Sí' : 'No'}`);
          console.log(`   - Fecha retiro: ${e.fecha_retiro || 'Ninguna'}`);
          console.log(`   - Motivo retiro: ${e.motivo_retiro || 'Ninguno'}`);
          
          // Simular lógica del badge
          if ((e.tiene_traslado && !e.fecha_retiro) || 
              (e.fecha_retiro && e.motivo_retiro && (
                e.motivo_retiro.toLowerCase().includes('traslado') || 
                e.motivo_retiro.toLowerCase().includes('cambio de curso')
              ))) {
            console.log('   → 🔵 Badge TRASLADO (azul)');
          } else if (e.fecha_retiro) {
            console.log('   → 🔴 Badge RETIRADO (rojo)');
          } else {
            console.log('   → ⚪ Sin badge');
          }
          console.log('');
        });
      } else {
        console.log('\n❌ No se encontraron estudiantes con traslados.');
        console.log('Puede que necesites realizar un cambio de curso primero para ver los badges.');
      }
      
      // Mostrar algunos estudiantes de ejemplo
      console.log('\n=== Primeros 3 estudiantes (para debug) ===');
      estudiantes.slice(0, 3).forEach((e, i) => {
        console.log(`${i+1}. ${e.apellidos}, ${e.nombres}`);
        console.log(`   - tiene_traslado: ${e.tiene_traslado}`);
        console.log(`   - fecha_retiro: ${e.fecha_retiro}`);
        console.log(`   - motivo_retiro: ${e.motivo_retiro}`);
        console.log('');
      });
      
    } else {
      console.error('Error: No se pudieron obtener los datos de estudiantes');
    }
  })
  .catch(error => {
    console.error('Error al obtener estudiantes:', error);
  });