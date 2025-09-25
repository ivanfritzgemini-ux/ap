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

    if (!asistenciaMarzData || asistenciaMarzData.length === 0) {
      return NextResponse.json({
        students: [],
        totalRecords: 0,
        month: 'Marzo 2025',
        isSimulated: false
      })
    }

    // Agrupar por estudiante y calcular estadísticas
    const estadisticasPorEstudiante = {}

    asistenciaMarzData.forEach(registro => {
      const { estudiante_id, presente } = registro
      
      if (!estadisticasPorEstudiante[estudiante_id]) {
        estadisticasPorEstudiante[estudiante_id] = {
          total_dias: 0,
          dias_presente: 0,
          dias_ausente: 0
        }
      }
      
      const stats = estadisticasPorEstudiante[estudiante_id]
      stats.total_dias++
      
      if (presente) {
        stats.dias_presente++
      } else {
        stats.dias_ausente++
      }
    })

    // Identificar estudiantes con 100% de asistencia
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

    // Si no hay estudiantes con 100%, devolver resultado vacío
    if (estudiantesConPerfectaAsistencia.length === 0) {
      return NextResponse.json({
        students: [],
        totalRecords: asistenciaMarzData.length,
        totalStudents: Object.keys(estadisticasPorEstudiante).length,
        month: 'Marzo 2025',
        isSimulated: false
      })
    }

    // Obtener información detallada de los estudiantes
    const estudianteIds = estudiantesConPerfectaAsistencia.map(e => e.estudiante_id)
    
    // Buscar por estudiante_id (según la estructura que encontramos)
    const { data: estudiantesDetalles, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select('id, estudiante_id, nro_registro, curso_id')
      .in('estudiante_id', estudianteIds)

    if (estudiantesError) {
      return NextResponse.json({ 
        error: estudiantesError.message,
        students: [],
        isSimulated: false 
      }, { status: 500 })
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
    const totalEstudiantes = Object.keys(estadisticasPorEstudiante).length
    const promedioAsistencia = Object.values(estadisticasPorEstudiante)
      .map(stats => (stats.dias_presente / stats.total_dias) * 100)
      .reduce((sum, porcentaje) => sum + porcentaje, 0) / totalEstudiantes

    return NextResponse.json({
      students: estudiantesCompletos,
      perfectAttendanceCount: estudiantesConPerfectaAsistencia.length,
      totalStudents: totalEstudiantes,
      perfectAttendancePercentage: ((estudiantesConPerfectaAsistencia.length / totalEstudiantes) * 100).toFixed(1),
      averageAttendance: promedioAsistencia.toFixed(1),
      totalRecords: asistenciaMarzData.length,
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