import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface ChangeCourseRequest {
  estudiante_id: string
  nuevo_curso_id: string
  fecha_cambio: string
  motivo_cambio: string
  observaciones?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as ChangeCourseRequest
    const { estudiante_id, nuevo_curso_id, fecha_cambio, motivo_cambio, observaciones } = body

    // Validaciones básicas
    if (!estudiante_id || !nuevo_curso_id || !fecha_cambio || !motivo_cambio) {
      return NextResponse.json({ 
        error: 'Campos requeridos: estudiante_id, nuevo_curso_id, fecha_cambio, motivo_cambio' 
      }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // 1. Verificar que el estudiante existe y tiene matrícula activa
    const { data: estudiante, error: estudianteError } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        estudiante_id,
        curso_id,
        nro_registro,
        fecha_retiro,
        es_matricula_actual,
        usuarios (
          rut,
          nombres,
          apellidos
        )
      `)
      .eq('estudiante_id', estudiante_id)
      .eq('es_matricula_actual', true)
      .single()

    if (estudianteError || !estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado o sin matrícula activa' }, { status: 404 })
    }

    if (estudiante.fecha_retiro) {
      return NextResponse.json({ 
        error: 'No se puede cambiar de curso a un estudiante retirado' 
      }, { status: 400 })
    }

    // 2. Verificar que el curso destino existe
    const { data: cursoDestino, error: cursoError } = await supabase
      .from('cursos')
      .select(`
        id,
        nivel,
        letra,
        tipo_educacion:tipo_educacion_id(nombre)
      `)
      .eq('id', nuevo_curso_id)
      .single()

    if (cursoError || !cursoDestino) {
      return NextResponse.json({ error: 'Curso destino no encontrado' }, { status: 404 })
    }

    // 3. Verificar que no sea el mismo curso
    if (estudiante.curso_id === nuevo_curso_id) {
      return NextResponse.json({ 
        error: 'El estudiante ya pertenece a este curso' 
      }, { status: 400 })
    }

    // 4. Obtener información del curso anterior para el historial
    let cursoAnterior = null
    if (estudiante.curso_id) {
      const { data: cursoAnt } = await supabase
        .from('cursos')
        .select(`
          id,
          nivel,
          letra,
          tipo_educacion:tipo_educacion_id(nombre)
        `)
        .eq('id', estudiante.curso_id)
        .single()
      
      cursoAnterior = cursoAnt
    }

    // 5. Registrar retiro del curso anterior
    const { error: retiroError } = await supabase
      .from('estudiantes_detalles')
      .update({ 
        fecha_retiro: fecha_cambio,
        motivo_retiro: `Cambio de curso: ${motivo_cambio}`,
        es_matricula_actual: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', estudiante.id)

    if (retiroError) {
      console.error('[change-course] Error registrando retiro del curso anterior:', retiroError)
      return NextResponse.json({ error: 'Error registrando retiro del curso anterior' }, { status: 500 })
    }

    // 6. Crear nueva matrícula en curso destino
    const { error: nuevaMatriculaError } = await supabase
      .from('estudiantes_detalles')
      .insert({
        estudiante_id,
        curso_id: nuevo_curso_id,
        nro_registro: estudiante.nro_registro,
        fecha_matricula: fecha_cambio,
        es_matricula_actual: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (nuevaMatriculaError) {
      console.error('[change-course] Error creando nueva matrícula:', nuevaMatriculaError)
      // Rollback: reactivar matrícula anterior
      await supabase
        .from('estudiantes_detalles')
        .update({ 
          fecha_retiro: null,
          motivo_retiro: null,
          es_matricula_actual: true
        })
        .eq('id', estudiante.id)
      return NextResponse.json({ error: 'Error creando nueva matrícula en curso destino' }, { status: 500 })
    }

    // 7. El historial ya se crea automáticamente con los registros de matrícula
    // Los registros en estudiantes_detalles con fecha_retiro forman el historial completo
    console.log(`[change-course] Cambio de curso completado para ${estudiante_id}: ${estudiante.curso_id} → ${nuevo_curso_id}`)

    // 8. Actualizar registros de asistencia futuros (opcional)
    // Los registros de asistencia pasados mantienen el curso original
    // Los futuros se asociarán al nuevo curso automáticamente por la nueva matrícula
    const { error: asistenciaError } = await supabase
      .from('asistencia')
      .update({ curso_id: nuevo_curso_id })
      .eq('estudiante_id', estudiante_id)
      .gte('fecha', fecha_cambio)

    if (asistenciaError) {
      console.warn('[change-course] No se pudieron actualizar registros de asistencia futuros:', asistenciaError)
    }

    // 9. Construir nombres de cursos para respuesta
    const cursoAnteriorNombre = cursoAnterior 
      ? `${cursoAnterior.nivel}° ${cursoAnterior.letra}` 
      : 'Sin curso anterior'
    
    const cursoNuevoNombre = `${cursoDestino.nivel}° ${cursoDestino.letra}`
    const usuarioData = Array.isArray(estudiante.usuarios) ? estudiante.usuarios[0] : estudiante.usuarios
    const estudianteNombre = `${usuarioData?.nombres} ${usuarioData?.apellidos}`

    return NextResponse.json({
      success: true,
      message: `Cambio de curso realizado exitosamente`,
      data: {
        estudiante: {
          id: estudiante_id,
          nombre: estudianteNombre,
          rut: usuarioData?.rut,
          nro_registro: estudiante.nro_registro
        },
        cambio: {
          curso_anterior: {
            id: estudiante.curso_id,
            nombre: cursoAnteriorNombre
          },
          curso_nuevo: {
            id: nuevo_curso_id,
            nombre: cursoNuevoNombre
          },
          fecha_cambio,
          motivo_cambio,
          observaciones
        }
      }
    })

  } catch (error: any) {
    console.error('[change-course] Error inesperado:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// Endpoint para obtener el historial de cambios de un estudiante
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const estudiante_id = searchParams.get('estudiante_id')

    if (!estudiante_id) {
      return NextResponse.json({ error: 'estudiante_id es requerido' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Obtener todas las matrículas del estudiante ordenadas por fecha
    const { data: matriculas, error } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        curso_id,
        fecha_matricula,
        fecha_retiro,
        motivo_retiro,
        es_matricula_actual,
        cursos!curso_id(
          nivel,
          letra,
          tipo_educacion_id
        )
      `)
      .eq('estudiante_id', estudiante_id)
      .order('fecha_matricula', { ascending: false })

    if (error) {
      console.error('[change-course] Error obteniendo historial:', error)
      return NextResponse.json({ error: 'Error obteniendo historial' }, { status: 500 })
    }

    // Formatear el historial basado en las matrículas
    const historialFormateado = (matriculas || []).map((matricula, index) => {
      const curso = Array.isArray(matricula.cursos) ? matricula.cursos[0] : matricula.cursos
      
      // Para simplificar, vamos a construir el nombre del curso básico
      const cursoNombre = curso 
        ? `${curso.nivel}° ${curso.letra}`
        : 'Curso no disponible'

      return {
        id: matricula.id,
        fecha_evento: matricula.fecha_retiro || matricula.fecha_matricula,
        tipo_evento: matricula.fecha_retiro ? 'Retiro' : 'Matrícula',
        curso_nombre: cursoNombre,
        motivo: matricula.motivo_retiro || 'Matrícula inicial',
        es_actual: matricula.es_matricula_actual,
        fecha_matricula: matricula.fecha_matricula,
        fecha_retiro: matricula.fecha_retiro
      }
    })

    return NextResponse.json({ data: historialFormateado })

  } catch (error: any) {
    console.error('[change-course] Error obteniendo historial:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}