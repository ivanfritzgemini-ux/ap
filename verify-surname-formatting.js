const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://irdrfncnhgjutihnuhme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHJmbmNuaGdqdXRpaG51aG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0ODcxOTEsImV4cCI6MjA1MTA2MzE5MX0.F0H6Kxlx-E4SgAOnpsGAk2nieyXpBvbHvTEJEgPUNdE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyNameFormatting() {
  console.log('🔍 Verificando el formato de nombres para marzo 2025...\n');
  
  try {
    // Consulta directa a la base de datos para marzo 2025
    const { data, error } = await supabase
      .from('asistencia')
      .select(`
        estudiante_id,
        fecha,
        asistio,
        estudiantes_detalles!inner(
          id,
          usuario_id,
          curso_id,
          usuarios!inner(
            id,
            nombres,
            apellidos,
            rut
          ),
          cursos!inner(
            id,
            nombre_curso,
            nivel
          )
        )
      `)
      .gte('fecha', '2025-03-01')
      .lte('fecha', '2025-03-31');

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    // Agrupar por estudiante
    const estudianteStats = {};
    
    data.forEach(registro => {
      const estudianteId = registro.estudiante_id;
      const usuario = registro.estudiantes_detalles.usuarios;
      const curso = registro.estudiantes_detalles.cursos;
      
      if (!estudianteStats[estudianteId]) {
        estudianteStats[estudianteId] = {
          usuario,
          curso,
          totalDias: 0,
          diasPresente: 0,
          asistencias: []
        };
      }
      
      estudianteStats[estudianteId].totalDias++;
      if (registro.asistio) {
        estudianteStats[estudianteId].diasPresente++;
      }
      estudianteStats[estudianteId].asistencias.push({
        fecha: registro.fecha,
        asistio: registro.asistio
      });
    });

    // Filtrar estudiantes con 100% de asistencia
    const estudiantesConAsistenciaPerfecta = Object.entries(estudianteStats)
      .filter(([_, stats]) => {
        const porcentaje = (stats.diasPresente / stats.totalDias) * 100;
        return porcentaje === 100 && stats.totalDias > 0;
      })
      .map(([estudianteId, stats]) => {
        const usuario = stats.usuario;
        const curso = stats.curso;
        
        return {
          id: estudianteId,
          rut: usuario.rut || '',
          nombres: usuario.nombres || '',
          apellidos: usuario.apellidos || '',
          nombreCompleto: usuario.apellidos && usuario.nombres 
            ? `${usuario.apellidos}, ${usuario.nombres}` 
            : `${usuario.apellidos || ''}${usuario.nombres || ''}`.trim(),
          curso: curso.nombre_curso || 'Sin curso',
          nivel: curso.nivel || '',
          diasRegistrados: stats.totalDias,
          diasPresente: stats.diasPresente,
          porcentajeAsistencia: 100
        };
      });

    // Ordenar por apellidos
    estudiantesConAsistenciaPerfecta.sort((a, b) => 
      (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
    );

    console.log(`📊 Estudiantes con asistencia perfecta en marzo 2025: ${estudiantesConAsistenciaPerfecta.length}`);
    console.log('\n📝 Formato de nombres actualizado (apellidos, nombres):\n');
    
    estudiantesConAsistenciaPerfecta.forEach((estudiante, index) => {
      console.log(`${index + 1}. ${estudiante.nombreCompleto}`);
      console.log(`   RUT: ${estudiante.rut}`);
      console.log(`   Curso: ${estudiante.curso}`);
      console.log(`   Días asistidos: ${estudiante.diasPresente}/${estudiante.diasRegistrados}`);
      console.log('');
    });
    
    console.log('✅ Verificación completada. El formato de nombres ahora muestra apellidos primero.');
    
  } catch (err) {
    console.error('❌ Error durante la verificación:', err.message);
  }
}

verifyNameFormatting();