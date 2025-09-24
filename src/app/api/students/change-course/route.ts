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

    // 1. Verificar que el estudiante existe y está activo
    const { data: estudiante, error: estudianteError } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        curso_id,
        nro_registro,
        fecha_retiro,
        usuarios (
          rut,
          nombres,
          apellidos
        )
      `)
      .eq('id', estudiante_id)
      .single()

    if (estudianteError || !estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
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

    // 5. Crear el registro del historial de cambio de curso
    const historialData = {
      estudiante_id,
      curso_anterior_id: estudiante.curso_id,
      curso_nuevo_id: nuevo_curso_id,
      fecha_cambio,
      motivo_cambio,
      observaciones,
      created_at: new Date().toISOString()
    }

    // 6. Actualizar el curso del estudiante
    const { error: updateError } = await supabase
      .from('estudiantes_detalles')
      .update({ 
        curso_id: nuevo_curso_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', estudiante_id)

    if (updateError) {
      console.error('[change-course] Error actualizando estudiante:', updateError)
      return NextResponse.json({ error: 'Error actualizando curso del estudiante' }, { status: 500 })
    }

    // 7. Crear tabla de historial si no existe (esto debería estar en migración)
    const createHistorialTable = `
      CREATE TABLE IF NOT EXISTS historial_cambios_curso (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        estudiante_id UUID NOT NULL,
        curso_anterior_id UUID,
        curso_nuevo_id UUID NOT NULL,
        fecha_cambio DATE NOT NULL,
        motivo_cambio VARCHAR(100) NOT NULL,
        observaciones TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        
        CONSTRAINT fk_historial_estudiante FOREIGN KEY (estudiante_id) 
          REFERENCES estudiantes_detalles(id) ON DELETE CASCADE,
        CONSTRAINT fk_historial_curso_anterior FOREIGN KEY (curso_anterior_id) 
          REFERENCES cursos(id) ON DELETE SET NULL,
        CONSTRAINT fk_historial_curso_nuevo FOREIGN KEY (curso_nuevo_id) 
          REFERENCES cursos(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_historial_cambios_estudiante 
        ON historial_cambios_curso(estudiante_id);
      CREATE INDEX IF NOT EXISTS idx_historial_cambios_fecha 
        ON historial_cambios_curso(fecha_cambio);
    `

    await supabase.rpc('exec_sql', { sql: createHistorialTable }).then(() => {}).catch(() => {})

    // 8. Insertar en historial de cambios
    const { error: historialError } = await supabase
      .from('historial_cambios_curso')
      .insert(historialData)

    if (historialError) {
      console.warn('[change-course] No se pudo crear historial:', historialError)
      // No falla la operación si no se puede crear el historial
    }

    // 9. Actualizar registros de asistencia futuros (opcional)
    // Los registros de asistencia pasados mantienen el curso original
    // Los futuros se asociarán al nuevo curso
    const fechaCambioDate = new Date(fecha_cambio)
    const { error: asistenciaError } = await supabase
      .from('asistencia')
      .update({ curso_id: nuevo_curso_id })
      .eq('estudiante_id', estudiante_id)
      .gte('fecha', fecha_cambio)

    if (asistenciaError) {
      console.warn('[change-course] No se pudieron actualizar registros de asistencia futuros:', asistenciaError)
    }

    // 10. Construir nombres de cursos para respuesta
    const cursoAnteriorNombre = cursoAnterior 
      ? `${cursoAnterior.nivel}° ${cursoAnterior.letra}` 
      : 'Sin curso anterior'
    
    const cursoNuevoNombre = `${cursoDestino.nivel}° ${cursoDestino.letra}`
    const estudianteNombre = `${estudiante.usuarios?.nombres} ${estudiante.usuarios?.apellidos}`

    return NextResponse.json({
      success: true,
      message: `Cambio de curso realizado exitosamente`,
      data: {
        estudiante: {
          id: estudiante_id,
          nombre: estudianteNombre,
          rut: estudiante.usuarios?.rut,
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

    const { data: historial, error } = await supabase
      .from('historial_cambios_curso')
      .select(`
        id,
        fecha_cambio,
        motivo_cambio,
        observaciones,
        created_at,
        curso_anterior:curso_anterior_id(nivel, letra),
        curso_nuevo:curso_nuevo_id(nivel, letra)
      `)
      .eq('estudiante_id', estudiante_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[change-course] Error obteniendo historial:', error)
      return NextResponse.json({ error: 'Error obteniendo historial' }, { status: 500 })
    }

    const historialFormateado = (historial || []).map(h => ({
      ...h,
      curso_anterior_nombre: h.curso_anterior 
        ? `${h.curso_anterior.nivel}° ${h.curso_anterior.letra}`
        : 'Sin curso anterior',
      curso_nuevo_nombre: `${h.curso_nuevo.nivel}° ${h.curso_nuevo.letra}`
    }))

    return NextResponse.json({ data: historialFormateado })

  } catch (error: any) {
    console.error('[change-course] Error obteniendo historial:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}