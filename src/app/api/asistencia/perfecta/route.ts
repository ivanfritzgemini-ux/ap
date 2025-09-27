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
    // Para marzo, el período de asistencia comienza el 5 de marzo
    const diaInicioMes = (parseInt(mes) === 3) ? 5 : 1
    const primerDia = `${año}-${mes.padStart(2, '0')}-${diaInicioMes.toString().padStart(2, '0')}`
    const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0]

    // Calcular días hábiles del mes
    const diasHabiles: string[] = []
    const diasEnMes = new Date(parseInt(año), parseInt(mes), 0).getDate()

    for (let dia = diaInicioMes; dia <= diasEnMes; dia++) {
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, dia)
      const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado

      // Solo incluir días de lunes a viernes
      if (diaSemana > 0 && diaSemana < 6) {
        diasHabiles.push(fecha.toISOString().split('T')[0])
      }
    }

    // Obtener registros de asistencia para el período
    const { data: asistenciaData, error: asistenciaError } = await supabase
      .from('asistencia')
      .select(`
        estudiante_id,
        curso_id,
        fecha,
        presente
      `)
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia)

    if (asistenciaError) {
      console.error('Error al obtener asistencia:', asistenciaError)
      return NextResponse.json({ error: asistenciaError.message }, { status: 500 })
    }

    if (!asistenciaData || asistenciaData.length === 0) {
      return NextResponse.json({
        mes: parseInt(mes),
        año: parseInt(año),
        total_dias_habiles: diasHabiles.length,
        estudiantes_perfectos: [],
        total: 0,
        message: 'No hay registros de asistencia para este mes'
      })
    }

    // Procesar datos: agrupar por estudiante y contar días asistidos
    const estudiantesMap: Record<string, any> = {}

    asistenciaData.forEach((registro: any) => {
      const key = `${registro.estudiante_id}-${registro.curso_id}`
      if (!estudiantesMap[key]) {
        estudiantesMap[key] = {
          estudiante_id: registro.estudiante_id,
          curso_id: registro.curso_id,
          dias_asistidos: 0,
          total_dias_habiles: diasHabiles.length
        }
      }
      if (registro.presente) {
        estudiantesMap[key].dias_asistidos++
      }
    })

    // Filtrar estudiantes con asistencia perfecta (100% de los días hábiles)
    const estudiantesConPerfectaAsistencia = Object.values(estudiantesMap)
      .filter((est: any) => est.dias_asistidos === est.total_dias_habiles)

    // Si hay estudiantes con asistencia perfecta, obtener sus datos personales
    if (estudiantesConPerfectaAsistencia.length > 0) {
      const estudianteIds = estudiantesConPerfectaAsistencia.map((e: any) => e.estudiante_id)
      const cursoIds = estudiantesConPerfectaAsistencia.map((e: any) => e.curso_id)

      // Obtener datos en paralelo
      const [estudiantesDetallesRes, usuariosRes, cursosRes] = await Promise.all([
        supabase
          .from('estudiantes_detalles')
          .select('id, estudiante_id, curso_id')
          .in('estudiante_id', estudianteIds),
        supabase
          .from('usuarios')
          .select('id, nombres, apellidos')
          .in('id', estudianteIds),
        supabase
          .from('cursos')
          .select('id, nombre_curso')
          .in('id', cursoIds)
      ])

      const estudiantesDetalles = estudiantesDetallesRes.data || []
      const usuariosData = usuariosRes.data || []
      const cursosData = cursosRes.data || []

      // Combinar los datos
      const estudiantesPerfectos = estudiantesDetalles.map((detalle: any) => {
        const usuario = usuariosData.find((u: any) => u.id === detalle.estudiante_id)
        const curso = cursosData.find((c: any) => c.id === detalle.curso_id)
        const stats = estudiantesConPerfectaAsistencia.find((e: any) =>
          e.estudiante_id === detalle.estudiante_id && e.curso_id === detalle.curso_id
        )

        return {
          id: detalle.id,
          nombres: usuario?.nombres || '',
          apellidos: usuario?.apellidos || '',
          nombreCompleto: usuario ? `${usuario.apellidos}, ${usuario.nombres}` : '',
          curso: curso?.nombre_curso || 'Sin curso',
          diasPresente: stats?.dias_asistidos || 0,
          diasRegistrados: stats?.total_dias_habiles || 0
        }
      })

      // Ordenar por curso y luego por apellidos
      estudiantesPerfectos.sort((a, b) => {
        const cursoComp = a.curso.localeCompare(b.curso, 'es', { sensitivity: 'base' })
        if (cursoComp !== 0) return cursoComp
        return a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' })
      })

      return NextResponse.json({
        mes: parseInt(mes),
        año: parseInt(año),
        total_dias_habiles: diasHabiles.length,
        total_estudiantes: estudiantesPerfectos.length,
        estudiantes_perfectos: estudiantesPerfectos,
        total_perfectos: estudiantesPerfectos.length,
        porcentaje_perfectos: estudiantesPerfectos.length > 0 ? '100.0' : '0.0'
      })
    }

    // No hay estudiantes con asistencia perfecta
    return NextResponse.json({
      mes: parseInt(mes),
      año: parseInt(año),
      total_dias_habiles: diasHabiles.length,
      estudiantes_perfectos: [],
      total: 0
    })

  } catch (err: any) {
    console.error('Error en GET /api/asistencia/perfecta:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}