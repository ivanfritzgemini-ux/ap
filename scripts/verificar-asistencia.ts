import { createServiceRoleClient } from '@/lib/supabase/server'

async function verificarAsistencia() {
  try {
    console.log('Iniciando verificación de asistencia...')
    
    const supabase = createServiceRoleClient()
    
    // 1. Verificar conexión básica
    console.log('1. Verificando conexión...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('asistencia')
      .select('count', { count: 'exact', head: true })

    if (healthError) {
      console.error('Error de conexión:', healthError)
      return
    }
    
    console.log('✅ Conexión exitosa')
    
    // 2. Contar registros totales
    console.log('2. Contando registros...')
    const { count } = await supabase
      .from('asistencia')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 Total de registros de asistencia: ${count || 0}`)
    
    // 3. Obtener muestra de datos
    console.log('3. Obteniendo muestra de datos...')
    const { data: sample, error: sampleError } = await supabase
      .from('asistencia')
      .select(`
        id,
        estudiante_id,
        curso_id,
        fecha,
        presente,
        created_at
      `)
      .limit(5)
      .order('created_at', { ascending: false })
    
    if (sampleError) {
      console.error('Error obteniendo muestra:', sampleError)
      return
    }
    
    console.log('📋 Muestra de datos:')
    sample?.forEach((registro, index) => {
      console.log(`  ${index + 1}. ID: ${registro.id}`)
      console.log(`     Estudiante: ${registro.estudiante_id}`)
      console.log(`     Curso: ${registro.curso_id}`)
      console.log(`     Fecha: ${registro.fecha}`)
      console.log(`     Presente: ${registro.presente}`)
      console.log(`     ---`)
    })
    
    // 4. Verificar datos por mes actual
    console.log('4. Verificando datos del mes actual...')
    const { data: currentMonth, error: monthError } = await supabase
      .from('asistencia')
      .select('*')
      .gte('fecha', '2025-09-01')
      .lte('fecha', '2025-09-30')
      .limit(10)
    
    if (monthError) {
      console.error('Error obteniendo datos del mes:', monthError)
      return
    }
    
    console.log(`📅 Registros de septiembre 2025: ${currentMonth?.length || 0}`)
    
    // 5. Verificar cursos disponibles
    console.log('5. Verificando cursos...')
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('id, nombre_curso')
      .limit(5)
    
    if (cursosError) {
      console.error('Error obteniendo cursos:', cursosError)
    } else {
      console.log(`🏫 Cursos disponibles: ${cursos?.length || 0}`)
      cursos?.forEach(curso => {
        console.log(`  - ${curso.nombre_curso} (ID: ${curso.id})`)
      })
    }
    
    console.log('✅ Verificación completada')
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  }
}

// Exportar para poder ejecutar
export { verificarAsistencia }

// Si se ejecuta directamente
if (require.main === module) {
  verificarAsistencia()
}