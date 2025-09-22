import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodoId = searchParams.get('periodoId')
    const cursoId = searchParams.get('cursoId')
    const asignaturaId = searchParams.get('asignaturaId')
    
    if (!periodoId || !cursoId || !asignaturaId) {
      return NextResponse.json({ 
        error: 'periodoId, cursoId y asignaturaId are required' 
      }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Primero obtener el curso_asignatura_id
    const { data: cursoAsignatura, error: caError } = await supabase
      .from('curso_asignatura')
      .select('id')
      .eq('curso_id', cursoId)
      .eq('asignatura_id', asignaturaId)
      .single()

    if (caError) {
      console.error('Error finding curso_asignatura:', caError)
      return NextResponse.json({ 
        error: 'No se encontró la relación curso-asignatura' 
      }, { status: 404 })
    }

    const curso_asignatura_id = cursoAsignatura.id

    // Obtener calificaciones para este contexto
    const { data, error } = await supabase
      .from('calificaciones')
      .select(`
        id,
        estudiante_id,
        notas,
        promedio,
        creado_en,
        actualizado_en
      `)
      .eq('periodo_academico_id', periodoId)
      .eq('curso_asignatura_id', curso_asignatura_id)

    if (error) {
      console.error('Error fetching calificaciones:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('Error in calificaciones GET API:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createServerClient()
    
    // Si se proporciona curso_id y asignatura_id, obtener curso_asignatura_id
    if (body.curso_id && body.asignatura_id && !body.curso_asignatura_id) {
      const { data: cursoAsignatura, error: caError } = await supabase
        .from('curso_asignatura')
        .select('id')
        .eq('curso_id', body.curso_id)
        .eq('asignatura_id', body.asignatura_id)
        .single()

      if (caError) {
        return NextResponse.json({ 
          error: 'No se encontró la relación curso-asignatura' 
        }, { status: 400 })
      }

      body.curso_asignatura_id = cursoAsignatura.id
      delete body.curso_id
      delete body.asignatura_id
    }

    // Asegurar que las notas estén en formato JSON si vienen como propiedades individuales
    if (body.nota1 !== undefined || body.nota2 !== undefined) {
      body.notas = {
        nota1: body.nota1 || null,
        nota2: body.nota2 || null,
        nota3: body.nota3 || null,
        nota4: body.nota4 || null,
        nota5: body.nota5 || null,
        nota6: body.nota6 || null,
        nota7: body.nota7 || null,
        nota8: body.nota8 || null,
        nota9: body.nota9 || null,
        nota10: body.nota10 || null,
      }
      // Limpiar propiedades individuales
      delete body.nota1; delete body.nota2; delete body.nota3; delete body.nota4; delete body.nota5;
      delete body.nota6; delete body.nota7; delete body.nota8; delete body.nota9; delete body.nota10;
    }

    // Convertir periodo_id a periodo_academico_id si es necesario
    if (body.periodo_id && !body.periodo_academico_id) {
      body.periodo_academico_id = body.periodo_id
      delete body.periodo_id
    }
    
    const { data, error } = await supabase
      .from('calificaciones')
      .insert(body)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('calificaciones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}