// Script para verificar cálculos de asistencia perfecta para todos los meses
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

// Función para obtener días hábiles de un mes
function obtenerDiasHabiles(año, mes) {
  const diasHabiles = []
  const diasEnMes = new Date(año, mes, 0).getDate()
  
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(año, mes - 1, dia)
    const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
    
    // Solo incluir días de lunes a viernes
    if (diaSemana > 0 && diaSemana < 6) {
      const fechaStr = fecha.toISOString().split('T')[0]
      diasHabiles.push(fechaStr)
    }
  }
  
  return diasHabiles
}

async function verificarAsistenciaPorMes(año, mes) {
  console.log(`\n🔍 Verificando asistencia perfecta para ${mes}/${año}...`)
  
  const supabase = createServiceRoleClient()
  
  try {
    // Obtener días hábiles del mes
    const diasHabiles = obtenerDiasHabiles(año, mes)
    console.log(`📅 Días hábiles en el mes: ${diasHabiles.length}`)
    
    // Obtener el primer y último día del mes
    const primerDia = `${año}-${mes.toString().padStart(2, '0')}-01`
    const ultimoDia = new Date(año, mes, 0).toISOString().split('T')[0]
    
    console.log(`📆 Rango de fechas: ${primerDia} a ${ultimoDia}`)
    
    // Obtener registros de asistencia del mes
    const { data: asistenciaMes, error: asistenciaError } = await supabase
      .from('asistencia')
      .select(`
        estudiante_id,
        fecha,
        presente,
        justificado
      `)
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia)
      .order('estudiante_id')
      .order('fecha')

    if (asistenciaError) {
      console.error('❌ Error al obtener asistencia:', asistenciaError)
      return
    }

    if (!asistenciaMes || asistenciaMes.length === 0) {
      console.log('⚠️ No hay registros de asistencia para este mes')
      return
    }

    console.log(`📊 Total de registros de asistencia: ${asistenciaMes.length}`)

    // Agrupar por estudiante y calcular estadísticas
    const estadisticasPorEstudiante = {}

    asistenciaMes.forEach(registro => {
      const { estudiante_id, fecha, presente, justificado } = registro
      
      if (!estadisticasPorEstudiante[estudiante_id]) {
        estadisticasPorEstudiante[estudiante_id] = {
          fechas_registradas: new Set(),
          dias_presente: 0,
          dias_ausente: 0,
          ausentes_justificadas: 0,
          ausentes_injustificadas: 0
        }
      }
      
      const stats = estadisticasPorEstudiante[estudiante_id]
      stats.fechas_registradas.add(fecha)
      
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

    // Convertir Set a array para facilitar el procesamiento
    Object.keys(estadisticasPorEstudiante).forEach(estudianteId => {
      const stats = estadisticasPorEstudiante[estudianteId]
      stats.fechas_registradas = Array.from(stats.fechas_registradas)
      stats.total_dias_registrados = stats.fechas_registradas.length
    })

    // Identificar estudiantes con 100% de asistencia
    const estudiantesConPerfectaAsistencia = []
    
    for (const [estudianteId, stats] of Object.entries(estadisticasPorEstudiante)) {
      const porcentajeAsistencia = stats.total_dias_registrados > 0 
        ? (stats.dias_presente / stats.total_dias_registrados) * 100 
        : 0
      
      if (porcentajeAsistencia === 100) {
        estudiantesConPerfectaAsistencia.push({
          estudiante_id: estudianteId,
          ...stats,
          porcentaje_asistencia: 100
        })
      }
    }

    console.log(`🎉 Estudiantes con 100% de asistencia: ${estudiantesConPerfectaAsistencia.length}`)

    // Si hay estudiantes con 100%, obtener sus datos personales
    if (estudiantesConPerfectaAsistencia.length > 0) {
      const estudianteIds = estudiantesConPerfectaAsistencia.map(e => e.estudiante_id)
      
      // Buscar por estudiante_id
      const { data: estudiantesDetalles, error: estudiantesError } = await supabase
        .from('estudiantes_detalles')
        .select('id, estudiante_id, nro_registro, curso_id')
        .in('estudiante_id', estudianteIds)

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

      // Obtener información de cursos
      const cursoIds = estudiantesDetalles?.map(ed => ed.curso_id) || []
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('id, nombre_curso, nivel, letra')
        .in('id', cursoIds)

      // Mostrar resultados
      console.log('\n📋 ESTUDIANTES CON 100% DE ASISTENCIA:')
      console.log('='.repeat(50))
      
      estudiantesDetalles?.forEach((detalle, index) => {
        const usuario = usuariosData?.find(u => u.id === detalle.estudiante_id)
        const curso = cursosData?.find(c => c.id === detalle.curso_id)
        const stats = estudiantesConPerfectaAsistencia.find(e => e.estudiante_id === detalle.estudiante_id)
        
        console.log(`\n${index + 1}. ${usuario?.nombres || 'Sin nombre'} ${usuario?.apellidos || 'Sin apellidos'}`)
        console.log(`   RUT: ${usuario?.rut || 'Sin RUT'}`)
        console.log(`   Curso: ${curso?.nombre_curso || `${curso?.nivel}${curso?.letra}` || 'Sin curso asignado'}`)
        console.log(`   Días registrados: ${stats?.total_dias_registrados}`)
        console.log(`   Días presente: ${stats?.dias_presente}`)
        console.log(`   Fechas: ${stats?.fechas_registradas?.slice(0, 3).join(', ')}${stats?.fechas_registradas?.length > 3 ? '...' : ''}`)
        console.log(`   Porcentaje: 100% ✅`)
      })
    }

    // Mostrar estadísticas generales
    const totalEstudiantes = Object.keys(estadisticasPorEstudiante).length
    const promedioAsistencia = totalEstudiantes > 0 ? Object.values(estadisticasPorEstudiante)
      .map(stats => stats.total_dias_registrados > 0 ? (stats.dias_presente / stats.total_dias_registrados) * 100 : 0)
      .reduce((sum, porcentaje) => sum + porcentaje, 0) / totalEstudiantes : 0

    console.log('\n📊 ESTADÍSTICAS GENERALES:')
    console.log('='.repeat(30))
    console.log(`Mes/Año: ${mes}/${año}`)
    console.log(`Días hábiles teóricos: ${diasHabiles.length}`)
    console.log(`Total de estudiantes con registros: ${totalEstudiantes}`)
    console.log(`Estudiantes con 100% asistencia: ${estudiantesConPerfectaAsistencia.length}`)
    console.log(`Porcentaje de estudiantes con 100%: ${totalEstudiantes > 0 ? ((estudiantesConPerfectaAsistencia.length / totalEstudiantes) * 100).toFixed(1) : 0}%`)
    console.log(`Promedio general de asistencia: ${promedioAsistencia.toFixed(1)}%`)

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Función principal para verificar múltiples meses
async function verificarMultiplesMeses() {
  console.log('🔍 VERIFICACIÓN DE CÁLCULOS DE ASISTENCIA PERFECTA')
  console.log('='.repeat(60))
  
  // Verificar algunos meses de 2025
  const mesesAVerificar = [
    { año: 2025, mes: 3 },  // Marzo (sabemos que tiene datos)
    { año: 2025, mes: 4 },  // Abril
    { año: 2025, mes: 5 },  // Mayo
    { año: 2025, mes: 8 },  // Agosto
    { año: 2025, mes: 9 }   // Septiembre (mes actual)
  ]
  
  for (const { año, mes } of mesesAVerificar) {
    await verificarAsistenciaPorMes(año, mes)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Pausa entre consultas
  }
}

// Ejecutar verificación
verificarMultiplesMeses()
  .then(() => {
    console.log('\n✅ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })