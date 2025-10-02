/**
 * Debug del Dashboard del Profesor
 * Este archivo nos ayuda a ver exactamente qué datos se están obteniendo
 */

console.log('🔍 Iniciando debug del dashboard del profesor...\n');

const { createServerClient } = require('./src/lib/supabase/server-debug');

async function debugTeacherDashboard() {
  try {
    console.log('📊 Simulando obtención de datos del dashboard...');
    
    // Simular el proceso que ocurre en getTeacherDashboardData()
    const supabase = await createServerClient();
    
    // Obtener información de un profesor específico (el ID que vimos en los logs)
    const userId = '4111f442-b4fe-4dd7-9763-a67920186554';
    
    console.log(`👨‍🏫 Usando profesor ID: ${userId}`);
    
    // 1. Obtener cursos donde es profesor jefe
    console.log('\n📚 1. Obteniendo cursos como profesor jefe...');
    const { data: cursosJefe, error: cursosError } = await supabase
      .from('cursos')
      .select(`
        id,
        nivel,
        letra,
        tipo_educacion:tipo_educacion_id(nombre)
      `)
      .eq('profesor_jefe_id', userId);
      
    if (cursosError) {
      console.error('❌ Error obteniendo cursos:', cursosError);
      return;
    }
    
    console.log(`✅ Cursos encontrados: ${cursosJefe?.length || 0}`);
    if (cursosJefe && cursosJefe.length > 0) {
      cursosJefe.forEach(curso => {
        console.log(`   - Curso ID: ${curso.id}, ${curso.nivel}º ${curso.letra}`);
      });
      
      // 2. Obtener estudiantes de esos cursos
      console.log('\n👥 2. Obteniendo estudiantes de los cursos...');
      const cursoIds = cursosJefe.map(c => c.id);
      
      const { data: estudiantesData, error: estudiantesError } = await supabase
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
        console.error('❌ Error obteniendo estudiantes:', estudiantesError);
      } else {
        console.log(`✅ Estudiantes encontrados: ${estudiantesData?.length || 0}`);
        
        if (estudiantesData) {
          const activos = estudiantesData.filter(e => e.es_matricula_actual && !e.fecha_retiro).length;
          const retirados = estudiantesData.filter(e => e.fecha_retiro).length;
          
          console.log(`   - Activos: ${activos}`);
          console.log(`   - Retirados: ${retirados}`);
          
          // Calcular género
          let masculino = 0, femenino = 0;
          
          estudiantesData.forEach(estudiante => {
            if (!estudiante.es_matricula_actual || estudiante.fecha_retiro) return;
            
            const sexoInfo = estudiante.usuarios?.sexo;
            const sexo = Array.isArray(sexoInfo) ? sexoInfo[0]?.nombre : sexoInfo?.nombre;
            
            if (sexo) {
              const sexoLimpio = sexo.toString().trim().toLowerCase();
              if (sexoLimpio.includes('masculino')) masculino++;
              else if (sexoLimpio.includes('femenino')) femenino++;
            }
          });
          
          console.log(`   - Masculino: ${masculino}`);
          console.log(`   - Femenino: ${femenino}`);
        }
      }
      
      // 3. Obtener asignaturas
      console.log('\n📖 3. Obteniendo asignaturas que imparte...');
      const { data: asignaturas, error: asignaturasError } = await supabase
        .from('asignaturas_profesor')
        .select(`
          id,
          asignaturas:asignatura_id(nombre)
        `)
        .eq('profesor_id', userId);
        
      if (asignaturasError) {
        console.error('❌ Error obteniendo asignaturas:', asignaturasError);
      } else {
        console.log(`✅ Asignaturas encontradas: ${asignaturas?.length || 0}`);
      }
      
      // 4. Simular el objeto final que debería retornar
      console.log('\n🎯 4. Objeto final que debería generar getTeacherDashboardData():');
      
      const finalData = {
        courses: cursosJefe || [],
        totalCourses: cursosJefe?.length || 0,
        totalStudents: estudiantesData?.length || 0,
        totalActiveStudents: estudiantesData ? estudiantesData.filter(e => e.es_matricula_actual && !e.fecha_retiro).length : 0,
        totalWithdrawnStudents: estudiantesData ? estudiantesData.filter(e => e.fecha_retiro).length : 0,
        totalSubjects: asignaturas?.length || 0,
        genderStats: {
          masculino: estudiantesData ? estudiantesData.filter(e => {
            if (!e.es_matricula_actual || e.fecha_retiro) return false;
            const sexoInfo = e.usuarios?.sexo;
            const sexo = Array.isArray(sexoInfo) ? sexoInfo[0]?.nombre : sexoInfo?.nombre;
            return sexo?.toString().trim().toLowerCase().includes('masculino');
          }).length : 0,
          femenino: estudiantesData ? estudiantesData.filter(e => {
            if (!e.es_matricula_actual || e.fecha_retiro) return false;
            const sexoInfo = e.usuarios?.sexo;
            const sexo = Array.isArray(sexoInfo) ? sexoInfo[0]?.nombre : sexoInfo?.nombre;
            return sexo?.toString().trim().toLowerCase().includes('femenino');
          }).length : 0
        },
        attendanceStats: {
          weeklyAverage: 92.5,
          monthlyAverage: 89.3,
          perfectAttendanceStudents: 3,
          latestAttendance: [
            { day: 'Lunes', percentage: 94, present: 13 },
            { day: 'Martes', percentage: 96, present: 14 },
            { day: 'Miércoles', percentage: 93, present: 13 },
            { day: 'Jueves', percentage: 91, present: 12 },
            { day: 'Viernes', percentage: 87, present: 12 }
          ]
        }
      };
      
      console.log(JSON.stringify(finalData, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Error durante el debug:', error);
  }
}

debugTeacherDashboard().then(() => {
  console.log('\n✅ Debug completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});