import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Consulta usando la tabla curso_asignatura como pivot
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
      .order('asignatura_id')

    if (error) {
      console.error('Error fetching asignaturas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalizar los datos para el frontend
    const normalized = (data || []).map((item: any) => {
      const asignatura = Array.isArray(item.asignatura) ? item.asignatura[0] : item.asignatura
      const curso = Array.isArray(item.curso) ? item.curso[0] : item.curso
      const profesorRel = Array.isArray(item.profesor) ? item.profesor[0] : item.profesor
      const profesor = profesorRel?.usuarios ? (Array.isArray(profesorRel.usuarios) ? profesorRel.usuarios[0] : profesorRel.usuarios) : null
      
      return {
        id: asignatura?.id,
        curso_asignatura_id: item.id, // ID de la relación para futuras operaciones
        nombre: asignatura?.nombre,
        descripcion: asignatura?.descripcion,
        curso: curso ? {
          id: curso.id,
          nombre: curso.nombre_curso || `${curso.nivel} ${curso.letra}`.trim()
        } : null,
        profesor: profesor ? {
          id: profesorRel?.id,
          nombre: `${profesor.nombres} ${profesor.apellidos}`.trim(),
          email: profesor.email
        } : null
      }
    })

    return NextResponse.json({ data: normalized })
  } catch (err: any) {
    console.error('Error in asignaturas API:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    
    // 1. Crear o buscar la asignatura
    let asignaturaRecord
    const { data: existingAsignatura } = await supabase
      .from('asignaturas')
      .select('id, nombre, descripcion')
      .eq('nombre', nombre)
      .single()
    
    if (existingAsignatura) {
      asignaturaRecord = existingAsignatura
    } else {
      const { data: newAsignatura, error: asignaturaError } = await supabase
        .from('asignaturas')
        .insert({
          nombre,
          descripcion: descripcion || null
        })
        .select('id, nombre, descripcion')
        .single()

      if (asignaturaError) {
        return NextResponse.json({ error: asignaturaError.message }, { status: 500 })
      }
      asignaturaRecord = newAsignatura
    }
    
    // 2. Crear la relación en curso_asignatura
    const { data: cursoAsignatura, error: relacionError } = await supabase
      .from('curso_asignatura')
      .insert({
        curso_id,
        asignatura_id: asignaturaRecord.id,
        profesor_id
      })
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

    if (relacionError) {
      return NextResponse.json({ error: relacionError.message }, { status: 500 })
    }

    // Normalizar la respuesta
    const asignaturaData = Array.isArray(cursoAsignatura.asignatura) ? cursoAsignatura.asignatura[0] : cursoAsignatura.asignatura
    const curso = Array.isArray(cursoAsignatura.curso) ? cursoAsignatura.curso[0] : cursoAsignatura.curso
    const profesorRel = Array.isArray(cursoAsignatura.profesor) ? cursoAsignatura.profesor[0] : cursoAsignatura.profesor
    const profesor = profesorRel?.usuarios ? (Array.isArray(profesorRel.usuarios) ? profesorRel.usuarios[0] : profesorRel.usuarios) : null
    
    const normalized = {
      id: asignaturaData?.id,
      curso_asignatura_id: cursoAsignatura.id,
      nombre: asignaturaData?.nombre,
      descripcion: asignaturaData?.descripcion,
      curso: curso ? {
        id: curso.id,
        nombre: curso.nombre_curso || `${curso.nivel} ${curso.letra}`.trim()
      } : null,
      profesor: profesor ? {
        id: profesorRel?.id,
        nombre: `${profesor.nombres} ${profesor.apellidos}`.trim(),
        email: profesor.email
      } : null
    }

    return NextResponse.json({ data: normalized }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}