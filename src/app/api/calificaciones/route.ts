import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodoId = searchParams.get('periodoId')
    const cursoId = searchParams.get('cursoId')
    const asignaturaId = searchParams.get('asignaturaId')
    
    console.log('GET /api/calificaciones params:', { periodoId, cursoId, asignaturaId })
    
    if (!periodoId || !cursoId || !asignaturaId) {
      console.error('Missing required parameters:', { periodoId, cursoId, asignaturaId })
      return NextResponse.json({ 
        error: 'periodoId, cursoId y asignaturaId are required' 
      }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Primero obtener el curso_asignatura_id
    console.log('Looking for curso_asignatura with:', { cursoId, asignaturaId })
    const { data: cursoAsignatura, error: caError } = await supabase
      .from('curso_asignatura')
      .select('id')
      .eq('curso_id', cursoId)
      .eq('asignatura_id', asignaturaId)
      .single()

    if (caError) {
      console.error('Error finding curso_asignatura:', caError)
      return NextResponse.json({ 
        error: 'No se encontró la relación curso-asignatura',
        details: caError.message 
      }, { status: 404 })
    }

    console.log('Found curso_asignatura:', cursoAsignatura)
    const curso_asignatura_id = cursoAsignatura.id

    // Obtener calificaciones para este contexto
    console.log('Looking for calificaciones with:', { periodoId, curso_asignatura_id })
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
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    console.log('Found calificaciones:', data?.length || 0)
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('Error in calificaciones GET API:', err)
    return NextResponse.json({ 
      error: err.message || 'Unknown error',
      stack: err.stack 
    }, { status: 500 })
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

    // Convertir notas a formato de arreglo para PostgreSQL si vienen como propiedades individuales
    if (body.nota1 !== undefined || body.nota2 !== undefined || body.notas) {
      if (body.notas && Array.isArray(body.notas)) {
        // Ya viene como arreglo, mantener
        // No hacer nada, ya está en formato correcto
      } else if (body.notas && typeof body.notas === 'object') {
        // Viene como objeto, convertir a arreglo
        const notasObj = body.notas
        body.notas = [
          notasObj.nota1,
          notasObj.nota2,
          notasObj.nota3,
          notasObj.nota4,
          notasObj.nota5,
          notasObj.nota6,
          notasObj.nota7,
          notasObj.nota8,
          notasObj.nota9,
          notasObj.nota10
        ].filter(nota => nota !== null && nota !== undefined)
      } else {
        // Viene como propiedades individuales, convertir a arreglo
        body.notas = [
          body.nota1,
          body.nota2,
          body.nota3,
          body.nota4,
          body.nota5,
          body.nota6,
          body.nota7,
          body.nota8,
          body.nota9,
          body.nota10
        ].filter(nota => nota !== null && nota !== undefined)
        
        // Limpiar propiedades individuales
        delete body.nota1; delete body.nota2; delete body.nota3; delete body.nota4; delete body.nota5;
        delete body.nota6; delete body.nota7; delete body.nota8; delete body.nota9; delete body.nota10;
      }
    }

    // Convertir periodo_id a periodo_academico_id si es necesario
    if (body.periodo_id && !body.periodo_academico_id) {
      body.periodo_academico_id = body.periodo_id
      delete body.periodo_id
    }

    // Calculate average manually to avoid trigger issues
    if (body.notas && Array.isArray(body.notas) && body.notas.length > 0) {
      const validNotas = body.notas.filter((nota: any) => nota !== null && nota !== undefined && typeof nota === 'number') as number[]
      if (validNotas.length > 0) {
        body.promedio = Number((validNotas.reduce((sum: number, nota: number) => sum + nota, 0) / validNotas.length).toFixed(1))
      }
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