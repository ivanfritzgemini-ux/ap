import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET /api/dashboard/perfect-attendance-march - Obtener estudiantes con 100% asistencia en marzo
export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // Verificar si existe la tabla de asistencia
    const { data: testData, error: testError } = await supabase
      .from('asistencia')
      .select('id')
      .limit(1)

    if (testError) {
      return NextResponse.json({ 
        error: 'Tabla de asistencia no disponible',
        students: [],
        isSimulated: true 
      }, { status: 200 })
    }

    // Calcular días hábiles de marzo 2025 (lunes a viernes)
    const diasHabiles = []
    const diasEnMarzo = new Date(2025, 3, 0).getDate() // Marzo tiene 31 días
    
    for (let dia = 1; dia <= diasEnMarzo; dia++) {
      const fecha = new Date(2025, 2, dia) // Mes 2 = marzo (0-indexed)
      const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
      
      // Solo incluir días de lunes a viernes
      if (diaSemana > 0 && diaSemana < 6) {
        const fechaStr = fecha.toISOString().split('T')[0]
        diasHabiles.push(fechaStr)
      }
    }

    // Obtener registros de asistencia de marzo 2025
    const { data: asistenciaMarzData, error: asistenciaError } = await supabase
      .from('asistencia')
      .select(`
        estudiante_id,
        fecha,
        presente,
        justificado
      `)
      .gte('fecha', '2025-03-01')
      .lte('fecha', '2025-03-31')
      .order('estudiante_id')
      .order('fecha')

    if (asistenciaError) {
      return NextResponse.json({ 
        error: asistenciaError.message,
        students: [],
        isSimulated: false 
      }, { status: 500 })
    }

    // 1. Obtener total de estudiantes matriculados en marzo usando consulta SQL directa
    const { count: totalEstudiantesMatriculados, error: matriculaError } = await supabase
      .from('estudiantes_detalles')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_matricula', '2025-03-01')
      .lt('fecha_matricula', '2025-04-01')

    if (matriculaError) {
      console.error('Error al obtener total matriculados:', matriculaError)
      return NextResponse.json({ 
        error: matriculaError.message,
        students: [],
        isSimulated: false 
      }, { status: 500 })
    }

    if (!asistenciaMarzData || asistenciaMarzData.length === 0) {
      return NextResponse.json({
        students: [],
        totalRecords: 0,
        totalDiasHabiles: diasHabiles.length,
        perfectAttendanceCount: 0,
        perfectAttendancePercentage: '0.0',
        totalStudents: totalEstudiantesMatriculados,
        month: 'Marzo 2025',
        isSimulated: false
      })
    }

    // Inicializar estadísticas para TODOS los estudiantes matriculados
    const estadisticasPorEstudiante: Record<string, any> = {}
    
    // Inicializar con todos los estudiantes matriculados
    todosLosEstudiantesDetalles?.forEach(detalle => {
      estadisticasPorEstudiante[detalle.estudiante_id] = {
        total_dias: 0,
        dias_presente: 0,
        dias_ausente: 0
      }
    })

    // Procesar registros de asistencia sobre la base de estudiantes matriculados
    asistenciaMarzData.forEach(registro => {
      const { estudiante_id, presente } = registro
      
      // Solo procesar si el estudiante está en la lista de matriculados
      if (estadisticasPorEstudiante[estudiante_id]) {
        const stats = estadisticasPorEstudiante[estudiante_id]
        stats.total_dias++
        
        if (presente) {
          stats.dias_presente++
        } else {
          stats.dias_ausente++
        }
      }
    })

    // Identificar estudiantes con 100% de asistencia
    const estudiantesConPerfectaAsistencia: any[] = []
    
    for (const [estudianteId, stats] of Object.entries(estadisticasPorEstudiante)) {
      // Un estudiante tiene 100% de asistencia solo si:
      // 1. Tiene registros de asistencia (total_dias > 0)
      // 2. Todos sus registros son de presente (dias_presente === total_dias)
      const tieneRegistros = stats.total_dias > 0
      const porcentajeAsistencia = tieneRegistros ? (stats.dias_presente / stats.total_dias) * 100 : 0
      
      if (tieneRegistros && porcentajeAsistencia === 100) {
        estudiantesConPerfectaAsistencia.push({
          estudiante_id: estudianteId,
          ...stats,
          porcentaje_asistencia: 100
        })
      }
    }

    // Si no hay estudiantes con 100%, devolver resultado vacío
    if (estudiantesConPerfectaAsistencia.length === 0) {
      return NextResponse.json({
        students: [],
        totalRecords: asistenciaMarzData.length,
        totalStudents: totalEstudiantesMatriculados,
        totalDiasHabiles: diasHabiles.length,
        perfectAttendanceCount: 0,
        perfectAttendancePercentage: '0.0',
        month: 'Marzo 2025',
        isSimulated: false
      })
    }

    // Obtener información detallada de los estudiantes con 100% de asistencia
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
      .select('id, nombre_curso, nivel')
      .in('id', cursoIds)

    // Combinar los datos
    const estudiantesCompletos = estudiantesDetalles?.map(detalle => {
      const usuario = usuariosData?.find(u => u.id === detalle.estudiante_id)
      const curso = cursosData?.find(c => c.id === detalle.curso_id)
      const stats = estudiantesConPerfectaAsistencia.find(e => e.estudiante_id === detalle.estudiante_id)

      return {
        id: detalle.id,
        rut: usuario?.rut || '',
        nombres: usuario?.nombres || '',
        apellidos: usuario?.apellidos || '',
        nombreCompleto: usuario?.apellidos && usuario?.nombres 
          ? `${usuario.apellidos}, ${usuario.nombres}` 
          : `${usuario?.apellidos || ''}${usuario?.nombres || ''}`.trim(),
        curso: curso?.nombre_curso || 'Sin curso',
        nivel: curso?.nivel || '',
        diasRegistrados: stats?.total_dias || 0,
        diasPresente: stats?.dias_presente || 0,
        porcentajeAsistencia: 100
      }
    }) || []

    // Calcular estadísticas generales
    const estudiantesConRegistros = Object.values(estadisticasPorEstudiante).filter(stats => stats.total_dias > 0)
    const promedioAsistencia = estudiantesConRegistros.length > 0 
      ? estudiantesConRegistros
          .map(stats => (stats.dias_presente / stats.total_dias) * 100)
          .reduce((sum, porcentaje) => sum + porcentaje, 0) / estudiantesConRegistros.length
      : 0

    return NextResponse.json({
      students: estudiantesCompletos,
      perfectAttendanceCount: estudiantesConPerfectaAsistencia.length,
      totalStudents: totalEstudiantesMatriculados,
      perfectAttendancePercentage: ((estudiantesConPerfectaAsistencia.length / totalEstudiantesMatriculados) * 100).toFixed(1),
      averageAttendance: promedioAsistencia.toFixed(1),
      totalRecords: asistenciaMarzData.length,
      totalDiasHabiles: diasHabiles.length,
      estudiantesConRegistros: estudiantesConRegistros.length,
      month: 'Marzo 2025',
      isSimulated: false
    })

  } catch (err: any) {
    console.error('Error in GET /api/dashboard/perfect-attendance-march:', err)
    return NextResponse.json({ 
      error: err.message || 'Unknown error',
      students: [],
      isSimulated: false 
    }, { status: 500 })
  }
}