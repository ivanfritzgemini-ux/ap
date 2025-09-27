const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase - cargando directamente las variables
const supabaseUrl = 'https://wlvscjityfaimzuzcqzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdnNjaml0eWZhaW16dXpjcXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTcyMDQsImV4cCI6MjA3Mjk5MzIwNH0.cmtLthBIFYueMyc5mlTGZA7iHl4KAA7l-hIttIRc6E8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarAsistenciaPerfecta() {
  console.log('🔍 VERIFICACIÓN FINAL DE ASISTENCIA PERFECTA POR CURSO\n');

  try {
    // Probar con abril 2025
    const mes = 4;
    const anio = 2025;

    console.log(`📅 Probando con ${new Date(anio, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}\n`);

    const response = await fetch(`http://localhost:9001/api/asistencia/perfecta-por-curso?mes=${mes}&anio=${anio}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Error en la API: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log('📊 RESULTADOS DE LA API:');
    console.log(`   Total de cursos con asistencia perfecta: ${data.length}`);

    if (data.length > 0) {
      data.forEach((curso, index) => {
        console.log(`\n🏫 CURSO ${index + 1}: ${curso.nombre_curso}`);
        console.log(`   👥 Estudiantes con asistencia perfecta: ${curso.estudiantes.length}`);

        if (curso.estudiantes.length > 0) {
          curso.estudiantes.slice(0, 3).forEach(estudiante => {
            console.log(`      ✓ ${estudiante.nombre_completo} (${estudiante.dias_asistidos}/${estudiante.dias_requeridos} días)`);
          });

          if (curso.estudiantes.length > 3) {
            console.log(`      ... y ${curso.estudiantes.length - 3} estudiantes más`);
          }
        }
      });
    } else {
      console.log('   ℹ️  No se encontraron estudiantes con asistencia perfecta para este mes');
    }

    console.log('\n✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

// Ejecutar verificación
verificarAsistenciaPerfecta();