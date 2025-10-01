// Script para obtener información de cursos y estudiantes matriculados
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getCourseInfo() {
  console.log('=== INFORMACIÓN DE CURSOS ===');

  // Obtener todos los cursos
  const { data: cursos, error: cursosError } = await supabase
    .from('cursos')
    .select('*')
    .order('nivel', { ascending: true });

  if (cursosError) {
    console.error('Error obteniendo cursos:', cursosError);
    return;
  }

  console.log(`Total de cursos: ${cursos.length}`);
  console.log('');

  for (const curso of cursos) {
    console.log(`📚 CURSO: ${curso.nombre_curso} (${curso.nivel}º ${curso.letra})`);
    console.log(`   ID: ${curso.id}`);
    console.log(`   Estado: ${curso.profesor_jefe_id ? 'Tiene profesor jefe' : 'Sin profesor jefe'}`);

    // Obtener estudiantes matriculados en este curso con información de usuario
    const { data: estudiantes, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        estudiante_id,
        fecha_matricula,
        es_matricula_actual,
        usuarios!inner(
          nombres,
          apellidos,
          email
        )
      `)
      .eq('curso_id', curso.id)
      .eq('es_matricula_actual', true);

    if (estudiantesError) {
      console.error(`Error obteniendo estudiantes del curso ${curso.nombre_curso}:`, estudiantesError);
    } else {
      console.log(`   👥 Estudiantes matriculados: ${estudiantes.length}`);

      if (estudiantes.length > 0) {
        console.log('   Lista de estudiantes:');
        estudiantes.forEach((est, index) => {
          const usuario = Array.isArray(est.usuarios) ? est.usuarios[0] : est.usuarios;
          console.log(`     ${index + 1}. ${usuario.apellidos}, ${usuario.nombres} (ID: ${est.id})`);
          console.log(`        Email: ${usuario.email || 'No disponible'}`);
          console.log(`        Fecha matrícula: ${new Date(est.fecha_matricula).toLocaleDateString('es-ES')}`);
        });
      }
    }

    // Obtener asignaturas del curso
    const { data: asignaturas, error: asignaturasError } = await supabase
      .from('asignaturas')
      .select('id, nombre, descripcion')
      .eq('curso_id', curso.id);

    if (asignaturasError) {
      console.error(`Error obteniendo asignaturas del curso ${curso.nombre_curso}:`, asignaturasError);
    } else {
      console.log(`   📖 Asignaturas: ${asignaturas.length}`);
      if (asignaturas.length > 0) {
        asignaturas.forEach(asig => {
          console.log(`     - ${asig.nombre}`);
          if (asig.descripcion) {
            console.log(`       "${asig.descripcion}"`);
          }
        });
      }
    }

    console.log('');
  }
}

getCourseInfo().catch(console.error);