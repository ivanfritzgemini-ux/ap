import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Obtener estudiantes con 100% de asistencia en un mes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')
    
    if (!mes || !año) {
      return NextResponse.json({ error: 'Se requieren los parámetros mes y año' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    
    // Obtener el primer y último día del mes
    const primerDia = `${año}-${mes.padStart(2, '0')}-01`
    const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0]
    
    // 1. Obtener todos los días hábiles del mes (lunes a viernes)
    const diasHabiles = []
    const diasEnMes = new Date(parseInt(año), parseInt(mes), 0).getDate()
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, dia)
      const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
      
      // Solo incluir días de lunes a viernes
      if (diaSemana > 0 && diaSemana < 6) {
        const fechaStr = fecha.toISOString().split('T')[0]
        diasHabiles.push(fechaStr)
      }
    }

    // 2. Obtener todos los registros de asistencia para el mes seleccionado
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
      console.error('Error al obtener asistencia:', asistenciaError)
      return NextResponse.json({ error: asistenciaError.message }, { status: 500 })
    }

    if (!asistenciaMes || asistenciaMes.length === 0) {
      return NextResponse.json({
        mes: parseInt(mes),
        año: parseInt(año),
        total_dias_habiles: diasHabiles.length,
        estudiantes_perfectos: [],
        total: 0,
        message: 'No hay registros de asistencia para este mes'
      })
    }

    // 3. Agrupar por estudiante y calcular estadísticas
    const estadisticasPorEstudiante: Record<string, any> = {}

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

    // Convertir Set a array y calcular totales
    Object.keys(estadisticasPorEstudiante).forEach(estudianteId => {
      const stats = estadisticasPorEstudiante[estudianteId]
      stats.fechas_registradas = Array.from(stats.fechas_registradas)
      stats.total_dias_registrados = stats.fechas_registradas.length
    })

    // 4. Identificar estudiantes con 100% de asistencia
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

    // 5. Si hay estudiantes con 100%, obtener sus datos personales
    const estudiantesPerfectos: any[] = []
    
    if (estudiantesConPerfectaAsistencia.length > 0) {
      const estudianteIds = estudiantesConPerfectaAsistencia.map(e => e.estudiante_id)
      
      // Buscar por estudiante_id
      const { data: estudiantesDetalles, error: estudiantesError } = await supabase
        .from('estudiantes_detalles')
        .select('id, estudiante_id, nro_registro, curso_id')
        .in('estudiante_id', estudianteIds)

      if (estudiantesError) {
        console.error('Error al obtener estudiantes detalles:', estudiantesError)
        return NextResponse.json({ error: estudiantesError.message }, { status: 500 })
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

      // Combinar los datos
      estudiantesDetalles?.forEach(detalle => {
        const usuario = usuariosData?.find(u => u.id === detalle.estudiante_id)
        const curso = cursosData?.find(c => c.id === detalle.curso_id)
        const stats = estudiantesConPerfectaAsistencia.find(e => e.estudiante_id === detalle.estudiante_id)
        
        if (stats) {
          // Formatear nombre con apellidos primero
          const nombres = usuario?.nombres || ''
          const apellidos = usuario?.apellidos || ''
          const nombreCompleto = apellidos && nombres 
            ? `${apellidos}, ${nombres}` 
            : `${apellidos}${nombres}`.trim()
          
          const nombreCurso = curso?.nombre_curso || `${curso?.nivel}${curso?.letra}` || 'Sin curso'
          
          estudiantesPerfectos.push({
            id: detalle.id,
            nombre: nombreCompleto,
            curso_id: detalle.curso_id,
            nombre_curso: nombreCurso,
            dias_asistidos: stats.dias_presente,
            total_dias_obligatorios: stats.total_dias_registrados
          })
        }
      })
    }

    return NextResponse.json({
      mes: parseInt(mes),
      año: parseInt(año),
      total_dias_habiles: diasHabiles.length,
      estudiantes_perfectos: estudiantesPerfectos,
      total: estudiantesPerfectos.length
    })
  } catch (err: any) {
    console.error('Error en GET /api/asistencia/perfecta:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}