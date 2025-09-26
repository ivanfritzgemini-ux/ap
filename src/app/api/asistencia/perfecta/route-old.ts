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

    // 2. Obtener total de estudiantes matriculados usando consulta SQL optimizada
    const { count: totalEstudiantesMatriculados, error: estudiantesDetallesError } = await supabase
      .from('estudiantes_detalles')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_matricula', primerDia)
      .lt('fecha_matricula', `${parseInt(año)}-${(parseInt(mes) + 1).toString().padStart(2, '0')}-01`)

    if (estudiantesDetallesError) {
      console.error('Error al obtener estudiantes detalles:', estudiantesDetallesError)
      return NextResponse.json({ error: estudiantesDetallesError.message }, { status: 500 })
    }

    // 3. Obtener todos los registros de asistencia para el mes seleccionado
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
        total_estudiantes: totalEstudiantesMatriculados,
        estudiantes_perfectos: [],
        total_perfectos: 0,
        porcentaje_perfectos: '0.0',
        message: 'No hay registros de asistencia para este mes'
      })
    }

    // 4. Inicializar estadísticas para TODOS los estudiantes matriculados
    const estadisticasPorEstudiante: Record<string, any> = {}
    
    // Inicializar con todos los estudiantes matriculados
    todosLosEstudiantesDetalles?.forEach(detalle => {
      estadisticasPorEstudiante[detalle.estudiante_id] = {
        fechas_registradas: new Set(),
        dias_presente: 0,
        dias_ausente: 0,
        ausentes_justificadas: 0,
        ausentes_injustificadas: 0
      }
    })

    // 5. Procesar registros de asistencia sobre la base de estudiantes matriculados
    asistenciaMes.forEach(registro => {
      const { estudiante_id, fecha, presente, justificado } = registro
      
      // Solo procesar si el estudiante está en la lista de matriculados
      if (estadisticasPorEstudiante[estudiante_id]) {
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
      }
    })

    // Convertir Set a array y calcular totales
    Object.keys(estadisticasPorEstudiante).forEach(estudianteId => {
      const stats = estadisticasPorEstudiante[estudianteId]
      stats.fechas_registradas = Array.from(stats.fechas_registradas)
      stats.total_dias_registrados = stats.fechas_registradas.length
    })

    // 6. Identificar estudiantes con 100% de asistencia
    const estudiantesConPerfectaAsistencia: any[] = []
    
    for (const [estudianteId, stats] of Object.entries(estadisticasPorEstudiante)) {
      // Un estudiante tiene 100% de asistencia solo si:
      // 1. Tiene registros de asistencia (total_dias_registrados > 0)
      // 2. Todos sus registros son de presente (dias_presente === total_dias_registrados)
      const tieneRegistros = stats.total_dias_registrados > 0
      const porcentajeAsistencia = tieneRegistros 
        ? (stats.dias_presente / stats.total_dias_registrados) * 100 
        : 0
      
      if (tieneRegistros && porcentajeAsistencia === 100) {
        estudiantesConPerfectaAsistencia.push({
          estudiante_id: estudianteId,
          ...stats,
          porcentaje_asistencia: 100
        })
      }
    }

    // 7. Si hay estudiantes con 100%, obtener sus datos personales
    const estudiantesPerfectos: any[] = []
    
    if (estudiantesConPerfectaAsistencia.length > 0) {
      const estudianteIds = estudiantesConPerfectaAsistencia.map(e => e.estudiante_id)
      
      // Filtrar de la lista de estudiantes ya obtenida
      const estudiantesDetalles = todosLosEstudiantesDetalles?.filter(detalle => 
        estudianteIds.includes(detalle.estudiante_id)
      )

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
            nombres: nombres,
            apellidos: apellidos,
            nombreCompleto: nombreCompleto,
            curso: nombreCurso,
            curso_id: detalle.curso_id,
            diasPresente: stats.dias_presente,
            diasRegistrados: stats.total_dias_registrados
          })
        }
      })

      // Ordenar por curso primero, luego por apellidos
      estudiantesPerfectos.sort((a, b) => {
        // Primero ordenar por curso
        const cursoComparacion = a.curso.localeCompare(b.curso, 'es', { sensitivity: 'base' })
        if (cursoComparacion !== 0) return cursoComparacion
        
        // Luego ordenar por apellidos
        const apellidosA = a.apellidos || a.nombreCompleto.split(',')[0]
        const apellidosB = b.apellidos || b.nombreCompleto.split(',')[0]
        return apellidosA.localeCompare(apellidosB, 'es', { sensitivity: 'base' })
      })
    }

    // Calcular porcentaje de estudiantes con asistencia perfecta
    const porcentajePerfectos = totalEstudiantesMatriculados > 0 
      ? ((estudiantesPerfectos.length / totalEstudiantesMatriculados) * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      mes: parseInt(mes),
      año: parseInt(año),
      total_dias_habiles: diasHabiles.length,
      total_estudiantes: totalEstudiantesMatriculados,
      estudiantes_perfectos: estudiantesPerfectos,
      total_perfectos: estudiantesPerfectos.length,
      porcentaje_perfectos: porcentajePerfectos
    })
  } catch (err: any) {
    console.error('Error en GET /api/asistencia/perfecta:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}