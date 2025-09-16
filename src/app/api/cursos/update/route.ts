import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, nivel, letra, nombre, tipo_educacion_id, profesor_jefe_id } = body || {}
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = await createServerClient()
    const payload: any = {}
    if (nivel !== undefined) payload.nivel = nivel
    if (letra !== undefined) payload.letra = letra
    if (nombre !== undefined) payload.nombre_curso = nombre
    if (tipo_educacion_id !== undefined) payload.tipo_educacion_id = tipo_educacion_id
    if (profesor_jefe_id !== undefined) payload.profesor_jefe_id = profesor_jefe_id

    const { data, error } = await supabase.from('cursos').update(payload).eq('id', id).select().single()
    if (error) {
      console.error('[api/cursos/update] supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/cursos/update] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
