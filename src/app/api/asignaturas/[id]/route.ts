import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // Buscar por ID de asignatura en curso_asignatura
    const { data, error } = await supabase
      .from('curso_asignatura')
      .select(`
        id,
        asignatura:asignatura_id(id, nombre, descripcion),
        curso:curso_id(id, nivel, letra, nombre_curso),
        profesor:profesor_id(
          id,
          usuarios(id, nombres, apellidos, email)
        )
      `)
      .eq('asignatura_id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalizar los datos - manejar arrays de Supabase
    const asignatura = Array.isArray(data.asignatura) ? data.asignatura[0] : data.asignatura
    const curso = Array.isArray(data.curso) ? data.curso[0] : data.curso
    const profesorRel = Array.isArray(data.profesor) ? data.profesor[0] : data.profesor
    const profesor = profesorRel?.usuarios ? (Array.isArray(profesorRel.usuarios) ? profesorRel.usuarios[0] : profesorRel.usuarios) : null
    
    const normalized = {
      id: asignatura?.id,
      curso_asignatura_id: data.id,
      nombre: asignatura?.nombre,
      descripcion: asignatura?.descripcion,
      curso: curso ? {
        id: curso.id,
        nombre: curso.nombre_curso || `${curso.nivel} ${curso.letra}`.trim()
      } : null,
      profesor: profesor ? {
        id: profesorRel.id,
        nombre: `${profesor.nombres} ${profesor.apellidos}`.trim(),
        email: profesor.email
      } : null
    }

    return NextResponse.json({ data: normalized })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nombre, descripcion, curso_id, profesor_id } = body
    
    // Validar campos requeridos
    if (!nombre || !curso_id || !profesor_id) {
      return NextResponse.json({ 
        error: 'Los campos nombre, curso_id y profesor_id son requeridos' 
      }, { status: 400 })
    }
    
    const supabase = await createServerClient()
    
    // 1. Actualizar la asignatura
    const { error: asignaturaError } = await supabase
      .from('asignaturas')
      .update({
        nombre,
        descripcion: descripcion || null
      })
      .eq('id', params.id)

    if (asignaturaError) {
      return NextResponse.json({ error: asignaturaError.message }, { status: 500 })
    }

    // 2. Actualizar la relación curso_asignatura
    const { data, error } = await supabase
      .from('curso_asignatura')
      .update({
        curso_id,
        profesor_id
      })
      .eq('asignatura_id', params.id)
      .select(`
        id,
        asignatura:asignatura_id(id, nombre, descripcion),
        curso:curso_id(id, nivel, letra, nombre_curso),
        profesor:profesor_id(
          id,
          usuarios(id, nombres, apellidos, email)
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Asignatura no encontrada' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalizar la respuesta
    const asignatura = Array.isArray(data.asignatura) ? data.asignatura[0] : data.asignatura
    const curso = Array.isArray(data.curso) ? data.curso[0] : data.curso
    const profesorRel = Array.isArray(data.profesor) ? data.profesor[0] : data.profesor
    const profesor = profesorRel?.usuarios ? (Array.isArray(profesorRel.usuarios) ? profesorRel.usuarios[0] : profesorRel.usuarios) : null
    
    const normalized = {
      id: asignatura?.id,
      curso_asignatura_id: data.id,
      nombre: asignatura?.nombre,
      descripcion: asignatura?.descripcion,
      curso: curso ? {
        id: curso.id,
        nombre: curso.nombre_curso || `${curso.nivel} ${curso.letra}`.trim()
      } : null,
      profesor: profesor ? {
        id: profesorRel.id,
        nombre: `${profesor.nombres} ${profesor.apellidos}`.trim(),
        email: profesor.email
      } : null
    }

    return NextResponse.json({ data: normalized })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // 1. Eliminar la relación curso_asignatura
    const { error: relacionError } = await supabase
      .from('curso_asignatura')
      .delete()
      .eq('asignatura_id', params.id)

    if (relacionError) {
      return NextResponse.json({ error: relacionError.message }, { status: 500 })
    }

    // 2. Opcionalmente eliminar la asignatura si no tiene más relaciones
    // Por ahora solo eliminaremos la relación para permitir reutilizar asignaturas
    
    return NextResponse.json({ message: 'Asignatura eliminada exitosamente' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}