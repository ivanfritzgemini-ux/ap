/**
 * Prueba de datos del dashboard del profesor
 * Este archivo prueba que la función getTeacherDashboardData funcione correctamente
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usando variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeacherDashboardData() {
  console.log('🔍 Probando datos del dashboard del profesor...\n');
  
  try {
    // Obtener un profesor de ejemplo (ID simulado basado en la estructura)
    console.log('📋 Obteniendo lista de profesores...');
    
    const { data: profesores, error: profesoresError } = await supabase
      .from('usuarios')
      .select(`
        id,
        nombres,
        apellidos,
        roles!inner(nombre_rol)
      `)
      .ilike('roles.nombre_rol', '%profesor%')
      .limit(1);
      
    if (profesoresError) {
      console.error('❌ Error al obtener profesores:', profesoresError);
      return;
    }
    
    if (!profesores || profesores.length === 0) {
      console.log('⚠️  No se encontraron profesores en la base de datos');
      return;
    }
    
    const profesor = profesores[0];
    console.log(`👨‍🏫 Profesor encontrado: ${profesor.nombres} ${profesor.apellidos} (ID: ${profesor.id})`);
    
    // Probar cursos donde es profesor jefe
    console.log('\n📚 Probando cursos como profesor jefe...');
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select(`
        id,
        nivel,
        letra,
        tipo_educacion:tipo_educacion_id(nombre)
      `)
      .eq('profesor_jefe_id', profesor.id);
      
    if (cursosError) {
      console.error('❌ Error al obtener cursos:', cursosError);
    } else {
      console.log(`✅ Cursos encontrados: ${cursos?.length || 0}`);
      if (cursos && cursos.length > 0) {
        cursos.forEach(curso => {
          const tipoEducacion = Array.isArray(curso.tipo_educacion) 
            ? curso.tipo_educacion[0]?.nombre 
            : curso.tipo_educacion?.nombre;
          console.log(`   - ${curso.nivel}º ${curso.letra} (${tipoEducacion || 'Sin tipo'})`);
        });
      }
    }
    
    // Probar estudiantes de esos cursos
    if (cursos && cursos.length > 0) {
      console.log('\n👥 Probando estudiantes de los cursos...');
      const cursoIds = cursos.map(c => c.id);
      
      const { data: estudiantes, error: estudiantesError } = await supabase
        .from('estudiantes_detalles')
        .select(`
          id,
          es_matricula_actual,
          fecha_retiro,
          usuarios!estudiante_id (
            sexo:sexo_id(nombre)
          )
        `)
        .in('curso_id', cursoIds);
        
      if (estudiantesError) {
        console.error('❌ Error al obtener estudiantes:', estudiantesError);
      } else {
        console.log(`✅ Estudiantes encontrados: ${estudiantes?.length || 0}`);
        
        if (estudiantes) {
          const activos = estudiantes.filter(e => e.es_matricula_actual && !e.fecha_retiro).length;
          const retirados = estudiantes.filter(e => e.fecha_retiro).length;
          console.log(`   - Activos: ${activos}`);
          console.log(`   - Retirados: ${retirados}`);
          
          // Estadísticas por género
          const masculino = estudiantes.filter(e => {
            if (!e.es_matricula_actual || e.fecha_retiro) return false;
            const sexoInfo = e.usuarios?.sexo;
            const sexo = Array.isArray(sexoInfo) ? sexoInfo[0]?.nombre : sexoInfo?.nombre;
            return sexo?.toLowerCase() === 'masculino';
          }).length;
          
          const femenino = estudiantes.filter(e => {
            if (!e.es_matricula_actual || e.fecha_retiro) return false;
            const sexoInfo = e.usuarios?.sexo;
            const sexo = Array.isArray(sexoInfo) ? sexoInfo[0]?.nombre : sexoInfo?.nombre;
            return sexo?.toLowerCase() === 'femenino';
          }).length;
          
          console.log(`   - Masculino: ${masculino}`);
          console.log(`   - Femenino: ${femenino}`);
        }
      }
    }
    
    // Probar asignaturas que imparte
    console.log('\n📖 Probando asignaturas que imparte...');
    const { data: asignaturas, error: asignaturasError } = await supabase
      .from('asignaturas_profesor')
      .select(`
        id,
        asignaturas:asignatura_id(nombre)
      `)
      .eq('profesor_id', profesor.id);
      
    if (asignaturasError) {
      console.error('❌ Error al obtener asignaturas:', asignaturasError);
    } else {
      console.log(`✅ Asignaturas encontradas: ${asignaturas?.length || 0}`);
      if (asignaturas && asignaturas.length > 0) {
        asignaturas.forEach(asignatura => {
          const nombre = Array.isArray(asignatura.asignaturas) 
            ? asignatura.asignaturas[0]?.nombre 
            : asignatura.asignaturas?.nombre;
          console.log(`   - ${nombre || 'Sin nombre'}`);
        });
      }
    }
    
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testTeacherDashboardData().then(() => {
  console.log('\n🏁 Prueba finalizada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});