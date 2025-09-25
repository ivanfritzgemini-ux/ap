// Script para verificar estudiantes con 100% de asistencia en marzo
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

// Crear cliente de Supabase con role de servicio
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function checkMarchAttendance() {
  console.log('🔍 Verificando asistencia de marzo 2025...')
  
  const supabase = createServiceRoleClient()
  
  try {
    // 1. Verificar si existe la tabla de asistencia
    console.log('✅ Verificando tabla de asistencia...')
    
    const { data: testData, error: testError } = await supabase
      .from('asistencia')
      .select('id')
      .limit(1)

    if (testError) {
      console.log('❌ La tabla de asistencia no existe o no es accesible:', testError.message)
      return
    }

    console.log('✅ Tabla de asistencia encontrada')

    // 2. Obtener todos los registros de asistencia de marzo 2025
    const { data: asistenciaMarzData, error: asistenciaError } = await supabase
      .from('asistencia')
      .select(`
        estudiante_id,
        fecha,
        presente,
        justificado,
        tipo_ausencia
      `)
      .gte('fecha', '2025-03-01')
      .lte('fecha', '2025-03-31')
      .order('estudiante_id')
      .order('fecha')

    if (asistenciaError) {
      console.error('❌ Error al obtener asistencia:', asistenciaError)
      return
    }

    if (!asistenciaMarzData || asistenciaMarzData.length === 0) {
      console.log('⚠️ No hay registros de asistencia para marzo 2025')
      return
    }

    console.log(`📊 Total de registros de asistencia en marzo: ${asistenciaMarzData.length}`)

    // 3. Agrupar por estudiante y calcular estadísticas
    const estadisticasPorEstudiante = {}

    asistenciaMarzData.forEach(registro => {
      const { estudiante_id, fecha, presente, justificado } = registro
      
      if (!estadisticasPorEstudiante[estudiante_id]) {
        estadisticasPorEstudiante[estudiante_id] = {
          total_dias: 0,
          dias_presente: 0,
          dias_ausente: 0,
          ausentes_justificadas: 0,
          ausentes_injustificadas: 0,
          fechas: []
        }
      }
      
      const stats = estadisticasPorEstudiante[estudiante_id]
      stats.total_dias++
      stats.fechas.push(fecha)
      
      if (presente) {
        stats.dias_presente++
      } else {
        stats.dias_ausente++
        if (justificado) {
          stats.ausentes_justificadas++
        } else {
          stats.ausentes_injustificadas++
        }
      }
    })

    // 4. Identificar estudiantes con 100% de asistencia
    const estudiantesConPerfectaAsistencia = []
    
    for (const [estudianteId, stats] of Object.entries(estadisticasPorEstudiante)) {
      const porcentajeAsistencia = (stats.dias_presente / stats.total_dias) * 100
      
      if (porcentajeAsistencia === 100) {
        estudiantesConPerfectaAsistencia.push({
          estudiante_id: estudianteId,
          ...stats,
          porcentaje_asistencia: 100
        })
      }
    }

    console.log('Debug - IDs de estudiantes con 100% asistencia:', 
      estudiantesConPerfectaAsistencia.map(e => e.estudiante_id))

    // 5. Si hay estudiantes con 100%, obtener sus datos personales
    if (estudiantesConPerfectaAsistencia.length > 0) {
      console.log(`🎉 ¡Encontrados ${estudiantesConPerfectaAsistencia.length} estudiantes con 100% de asistencia en marzo!`)
      
      const estudianteIds = estudiantesConPerfectaAsistencia.map(e => e.estudiante_id)
      console.log('Debug - Buscando estudiantes con IDs:', estudianteIds)
      
      // Intentar buscar tanto por id como por estudiante_id
      const { data: estudiantesDetalles1, error: error1 } = await supabase
        .from('estudiantes_detalles')
        .select('id, estudiante_id, nro_registro, curso_id')
        .in('id', estudianteIds)

      const { data: estudiantesDetalles2, error: error2 } = await supabase
        .from('estudiantes_detalles')
        .select('id, estudiante_id, nro_registro, curso_id')
        .in('estudiante_id', estudianteIds)

      console.log('Debug - Búsqueda por id:', estudiantesDetalles1?.length || 0)
      console.log('Debug - Búsqueda por estudiante_id:', estudiantesDetalles2?.length || 0)
      
      // Usar el resultado que tenga datos
      const estudiantesDetalles = estudiantesDetalles1?.length > 0 ? estudiantesDetalles1 : estudiantesDetalles2
      const estudiantesError = estudiantesDetalles1?.length > 0 ? error1 : error2

      if (estudiantesError) {
        console.error('❌ Error al obtener estudiantes detalles:', estudiantesError)
        return
      }

      // Obtener información de usuarios
      const usuarioIds = estudiantesDetalles?.map(ed => ed.estudiante_id) || []
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, rut, nombres, apellidos')
        .in('id', usuarioIds)

      if (usuariosError) {
        console.error('❌ Error al obtener usuarios:', usuariosError)
        return
      }

      // Obtener información de cursos
      const cursoIds = estudiantesDetalles?.map(ed => ed.curso_id) || []
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('id, nombre_curso, nivel')
        .in('id', cursoIds)

      if (cursosError) {
        console.error('❌ Error al obtener cursos:', cursosError)
        return
      }

      // Combinar los datos
      const estudiantesData = estudiantesDetalles?.map(detalle => ({
        ...detalle,
        usuario: usuariosData?.find(u => u.id === detalle.estudiante_id),
        curso: cursosData?.find(c => c.id === detalle.curso_id)
      }))

      console.log('Debug - Estudiantes detalles:', estudiantesDetalles?.length)
      console.log('Debug - Usuarios:', usuariosData?.length)
      console.log('Debug - Cursos:', cursosData?.length)

      if (estudiantesError) {
        console.error('❌ Error al obtener datos de estudiantes:', estudiantesError)
        return
      }

      // 6. Mostrar resultados completos
      console.log('\n📋 ESTUDIANTES CON 100% DE ASISTENCIA EN MARZO 2025:')
      console.log('='.repeat(60))
      
      estudiantesData?.forEach((estudiante, index) => {
        const stats = estudiantesConPerfectaAsistencia.find(e => e.estudiante_id === estudiante.estudiante_id)
        
        console.log(`\n${index + 1}. ${estudiante.usuario?.nombres || 'Sin nombre'} ${estudiante.usuario?.apellidos || 'Sin apellidos'}`)
        console.log(`   RUT: ${estudiante.usuario?.rut || 'Sin RUT'}`)
        console.log(`   Curso: ${estudiante.curso?.nombre_curso || 'Sin curso asignado'}`)
        console.log(`   Días registrados: ${stats?.total_dias}`)
        console.log(`   Días presente: ${stats?.dias_presente}`)
        console.log(`   Porcentaje: 100% ✅`)
      })
      
    } else {
      console.log('😔 No se encontraron estudiantes con 100% de asistencia en marzo 2025')
    }

    // 7. Mostrar estadísticas generales
    const totalEstudiantes = Object.keys(estadisticasPorEstudiante).length
    const promedioAsistencia = Object.values(estadisticasPorEstudiante)
      .map(stats => (stats.dias_presente / stats.total_dias) * 100)
      .reduce((sum, porcentaje) => sum + porcentaje, 0) / totalEstudiantes

    console.log('\n📊 ESTADÍSTICAS GENERALES DE MARZO 2025:')
    console.log('='.repeat(40))
    console.log(`Total de estudiantes: ${totalEstudiantes}`)
    console.log(`Estudiantes con 100% asistencia: ${estudiantesConPerfectaAsistencia.length}`)
    console.log(`Porcentaje de estudiantes con 100%: ${((estudiantesConPerfectaAsistencia.length / totalEstudiantes) * 100).toFixed(1)}%`)
    console.log(`Promedio general de asistencia: ${promedioAsistencia.toFixed(1)}%`)

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
checkMarchAttendance()
  .then(() => {
    console.log('\n✅ Análisis completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })