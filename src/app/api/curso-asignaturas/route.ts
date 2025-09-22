import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursoId = searchParams.get('cursoId')
    
    if (!cursoId) {
      return NextResponse.json({ error: 'cursoId is required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Obtener asignaturas asociadas al curso específico
    const { data, error } = await supabase
      .from('curso_asignatura')
      .select(`
        id,
        asignaturas (
          id,
          nombre
        )
      `)
      .eq('curso_id', cursoId)

    if (error) {
      console.error('Error fetching curso asignaturas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalizar los datos - extraer las asignaturas del join y agregar curso_asignatura_id
    const asignaturas = data.map((item: any) => {
      const asignatura = Array.isArray(item.asignaturas) ? item.asignaturas[0] : item.asignaturas
      return {
        ...asignatura,
        curso_asignatura_id: item.id // Agregar el ID de la relación
      }
    }).filter(Boolean)

    // Si no hay asignaturas específicas del curso, devolver todas las asignaturas disponibles
    if (asignaturas.length === 0) {
      console.log('No se encontraron asignaturas específicas para el curso, obteniendo todas las asignaturas')
      const { data: allAsignaturas, error: allError } = await supabase
        .from('asignaturas')
        .select('id, nombre')
        .order('nombre')

      if (allError) {
        console.error('Error fetching all asignaturas:', allError)
        return NextResponse.json({ error: allError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        data: allAsignaturas.map(asig => ({ ...asig, curso_asignatura_id: null })),
        message: 'No hay asignaturas específicas para este curso. Mostrando todas las asignaturas disponibles.'
      })
    }

    return NextResponse.json({ data: asignaturas })
  } catch (err: any) {
    console.error('Error in curso-asignaturas API:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { curso_id, asignatura_id } = await request.json()
    
    if (!curso_id || !asignatura_id) {
      return NextResponse.json({ 
        error: 'curso_id and asignatura_id are required' 
      }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Verificar si la relación ya existe
    const { data: existing, error: checkError } = await supabase
      .from('curso_asignatura')
      .select('id')
      .eq('curso_id', curso_id)
      .eq('asignatura_id', asignatura_id)
      .single()

    if (existing) {
      return NextResponse.json({ 
        data: existing,
        message: 'Relación ya existe'
      })
    }

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // Crear nueva relación
    const { data, error } = await supabase
      .from('curso_asignatura')
      .insert({ curso_id, asignatura_id })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating curso-asignatura relation:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}