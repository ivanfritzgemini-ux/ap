import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Endpoint para obtener resumen de asistencia por curso con datos reales
export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // Obtener año escolar actual (marzo a diciembre del año actual, o diciembre del año anterior si estamos en ene/feb)
    const fechaActual = new Date()
    let añoEscolar = fechaActual.getFullYear()
    
    if (fechaActual.getMonth() < 2) { // Enero o Febrero
      añoEscolar = añoEscolar - 1
    }
    
    const fechaInicio = `${añoEscolar}-03-01`
    const fechaFin = `${añoEscolar}-12-31`
    
    // Obtener todos los cursos activos
    const { data: cursos, error: errorCursos } = await supabase
      .from('cursos')
      .select('id, nombre_curso, nivel')
      .order('nombre_curso')
    
    if (errorCursos) {
      console.error('Error obteniendo cursos:', errorCursos)
      return NextResponse.json({ 
        success: false, 
        error: errorCursos.message 
      }, { status: 500 })
    }
    
    if (!cursos || cursos.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: 'No se encontraron cursos',
        asistenciaPromedio: 0,
        diasHabiles: 0,
        cursos: [],
        cursosConProblemas: 0
      })
    }
    
    // Calcular asistencia por curso
    const cursosConAsistencia = await Promise.all(
      cursos.map(async (curso) => {
        // Obtener todos los registros de asistencia del curso para el año escolar
        const { data: registrosAsistencia, error: errorAsistencia } = await supabase
          .from('asistencia')
          .select('presente, fecha')
          .eq('curso_id', curso.id)
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin)
        
        if (errorAsistencia) {
          console.error(`Error obteniendo asistencia para curso ${curso.id}:`, errorAsistencia)
          return {
            id: curso.id,
            nombre: curso.nombre_curso,
            asistenciaPromedio: 0
          }
        }
        
        if (!registrosAsistencia || registrosAsistencia.length === 0) {
          return {
            id: curso.id,
            nombre: curso.nombre_curso,
            asistenciaPromedio: 0
          }
        }
        
        // Calcular porcentaje de asistencia
        const totalRegistros = registrosAsistencia.length
        const asistenciasPresentes = registrosAsistencia.filter(r => r.presente === true).length
        const porcentajeAsistencia = Math.round((asistenciasPresentes / totalRegistros) * 100)
        
        return {
          id: curso.id,
          nombre: curso.nombre_curso,
          asistenciaPromedio: porcentajeAsistencia
        }
      })
    )
    
    // Filtrar cursos que tienen datos de asistencia
    const cursosConDatos = cursosConAsistencia.filter(curso => curso.asistenciaPromedio > 0)
    
    // Calcular estadísticas generales
    const promedioGeneral = cursosConDatos.length > 0 
      ? Math.round(cursosConDatos.reduce((sum, curso) => sum + curso.asistenciaPromedio, 0) / cursosConDatos.length)
      : 0
    
    const cursosConProblemas = cursosConDatos.filter(c => c.asistenciaPromedio < 80).length
    
    // Obtener número de días hábiles estimados para el año escolar
    const diasHabiles = Math.round((10 * 22)) // 10 meses escolares * ~22 días hábiles por mes
    
    return NextResponse.json({
      success: true,
      asistenciaPromedio: promedioGeneral,
      diasHabiles: diasHabiles,
      cursos: cursosConDatos,
      cursosConProblemas: cursosConProblemas,
      añoEscolar: añoEscolar,
      totalCursos: cursos.length,
      cursosConDatos: cursosConDatos.length
    })

  } catch (err: any) {
    console.error('Error en resumen de asistencia:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message 
    }, { status: 500 })
  }
}