import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Obtener estudiantes con 100% de asistencia agrupados por curso en un mes
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
    // Solo marzo inicia el 5, los demás meses inician el 1
    let diaInicioMes = 1;
    if (parseInt(mes) === 3) {
      diaInicioMes = 5;
    }
    const primerDia = `${año}-${mes.padStart(2, '0')}-${diaInicioMes.toString().padStart(2, '0')}`;
    const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0];

    // Calcular días hábiles del mes
    const diasHabiles: string[] = [];
    const diasEnMes = new Date(parseInt(año), parseInt(mes), 0).getDate();

    for (let dia = diaInicioMes; dia <= diasEnMes; dia++) {
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, dia);
      const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado

      // Solo incluir días de lunes a viernes
      if (diaSemana > 0 && diaSemana < 6) {
        diasHabiles.push(fecha.toISOString().split('T')[0]);
      }
    }

    // Obtener todos los cursos
    const { data: cursosData, error: cursosError } = await supabase
      .from('cursos')
      .select('id, nombre_curso')
      .order('nombre_curso')

    if (cursosError) {
      console.error('Error al obtener cursos:', cursosError)
      return NextResponse.json({ error: cursosError.message }, { status: 500 })
    }

    if (!cursosData || cursosData.length === 0) {
      return NextResponse.json({
        mes: parseInt(mes),
        año: parseInt(año),
        total_dias_habiles: diasHabiles.length,
        cursos: [],
        total_estudiantes_perfectos: 0
      })
    }

    const resultadosPorCurso = []

    // Procesar cada curso
    for (const curso of cursosData) {
      // Obtener datos de estudiantes matriculados en este curso durante el período
      const [estudiantesDetallesRes, asistenciaDataRes] = await Promise.all([
        supabase
          .from('estudiantes_detalles')
          .select('id, estudiante_id, curso_id, fecha_matricula, fecha_retiro')
          .eq('curso_id', curso.id)
          .or(`and(fecha_matricula.lte.${ultimoDia},or(fecha_retiro.is.null,fecha_retiro.gte.${primerDia}))`),
        supabase
          .from('asistencia')
          .select(`
            estudiante_id,
            curso_id,
            fecha,
            presente
          `)
          .eq('curso_id', curso.id)
          .gte('fecha', primerDia)
          .lte('fecha', ultimoDia)
      ])

      if (estudiantesDetallesRes.error) {
        console.error(`Error al obtener estudiantes para curso ${curso.nombre_curso}:`, estudiantesDetallesRes.error)
        continue
      }

      if (asistenciaDataRes.error) {
        console.error(`Error al obtener asistencia para curso ${curso.nombre_curso}:`, asistenciaDataRes.error)
        continue
      }

      const estudiantesDetalles = estudiantesDetallesRes.data || []
      const asistenciaData = asistenciaDataRes.data || []

      if (estudiantesDetalles.length === 0) {
        resultadosPorCurso.push({
          curso_id: curso.id,
          nombre_curso: curso.nombre_curso,
          estudiantes_perfectos: [],
          total_estudiantes: 0,
          porcentaje_perfectos: 0
        })
        continue
      }

      // Procesar cada estudiante para calcular su asistencia perfecta
      const estudiantesPerfectos: any[] = []

      for (const estudiante of estudiantesDetalles) {
        // Calcular el período de asistencia para este estudiante
        const fechaInicioEstudiante = new Date(Math.max(
          new Date(primerDia).getTime(),
          new Date(estudiante.fecha_matricula).getTime()
        ))

        const fechaFinEstudiante = estudiante.fecha_retiro
          ? new Date(Math.min(new Date(ultimoDia).getTime(), new Date(estudiante.fecha_retiro).getTime()))
          : new Date(ultimoDia)

        // Calcular días hábiles para este estudiante (desde su matrícula hasta su retiro o fin del mes)
        const diasHabilesEstudiante: string[] = []
        const fechaActual = new Date(fechaInicioEstudiante)

        while (fechaActual <= fechaFinEstudiante) {
          const diaSemana = fechaActual.getDay()
          // Solo días hábiles (lunes a viernes)
          if (diaSemana > 0 && diaSemana < 6) {
            diasHabilesEstudiante.push(fechaActual.toISOString().split('T')[0])
          }
          fechaActual.setDate(fechaActual.getDate() + 1)
        }

        if (diasHabilesEstudiante.length === 0) continue

        // Contar días asistidos por este estudiante
        const asistenciaEstudiante = asistenciaData.filter(
          (a: any) => a.estudiante_id === estudiante.estudiante_id && a.presente
        )

        const diasAsistidos = asistenciaEstudiante.length

        // Verificar si tiene asistencia perfecta (100% de sus días hábiles)
        if (diasAsistidos === diasHabilesEstudiante.length) {
          // Obtener datos del usuario
          const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('id, nombres, apellidos')
            .eq('id', estudiante.estudiante_id)
            .single()

          const usuario = usuarioData

          estudiantesPerfectos.push({
            id: estudiante.id,
            nombres: usuario?.nombres || '',
            apellidos: usuario?.apellidos || '',
            nombreCompleto: usuario ? `${usuario.apellidos}, ${usuario.nombres}` : '',
            diasPresente: diasAsistidos,
            diasRegistrados: diasHabilesEstudiante.length,
            fechaMatricula: estudiante.fecha_matricula,
            fechaRetiro: estudiante.fecha_retiro
          })
        }
      }

      // Ordenar estudiantes perfectos por apellidos
      estudiantesPerfectos.sort((a: any, b: any) => a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' }))

      resultadosPorCurso.push({
        curso_id: curso.id,
        nombre_curso: curso.nombre_curso,
        estudiantes_perfectos: estudiantesPerfectos,
        total_estudiantes: estudiantesPerfectos.length,
        porcentaje_perfectos: estudiantesPerfectos.length > 0 ? 100 : 0
      })
    }

    // Calcular totales generales
    const totalEstudiantesPerfectos = resultadosPorCurso.reduce((sum, curso) => sum + curso.total_estudiantes, 0)

    return NextResponse.json({
      mes: parseInt(mes),
      año: parseInt(año),
      total_dias_habiles: diasHabiles.length,
      cursos: resultadosPorCurso,
      total_estudiantes_perfectos: totalEstudiantesPerfectos,
      resumen: {
        cursos_con_perfectos: resultadosPorCurso.filter(c => c.total_estudiantes > 0).length,
        cursos_sin_perfectos: resultadosPorCurso.filter(c => c.total_estudiantes === 0).length,
        promedio_por_curso: resultadosPorCurso.length > 0 ? Math.round((totalEstudiantesPerfectos / resultadosPorCurso.length) * 10) / 10 : 0
      }
    })

  } catch (err: any) {
    console.error('Error en GET /api/asistencia/perfecta-por-curso:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}