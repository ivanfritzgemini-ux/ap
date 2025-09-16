import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
  const { nivel, letra, nombre, tipo_ensenanza, tipo_educacion_id, profesor_jefe_id, descripcion } = body || {}
    const supabase = await createServerClient()

    const payload: any = {
      nivel: nivel ?? null,
      letra: letra ?? null,
    }
    if (nombre) payload.nombre_curso = nombre
  // prefer inserting foreign key to tipo_educacion
  if (tipo_educacion_id) payload.tipo_educacion_id = tipo_educacion_id
  else if (tipo_ensenanza) payload.tipo_ensenanza = tipo_ensenanza
    if (profesor_jefe_id) payload.profesor_jefe_id = profesor_jefe_id
    if (descripcion) payload.descripcion = descripcion

    const { data, error } = await supabase.from('cursos').insert([payload]).select().single()
    if (error) {
      console.error('[api/cursos/create] supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/cursos/create] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
