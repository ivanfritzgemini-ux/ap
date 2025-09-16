import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { pathname } = new URL(req.url)
  const parts = pathname.split('/')
  const id = parts[parts.length - 1]
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('estudiantes_detalles')
      .select('id, nro_registro, fecha_matricula, curso_id, usuarios(id, rut, nombres, apellidos, email, telefono, direccion, fecha_nacimiento, sexo_id)')
      .eq('id', id)
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // normalize shape: usuarios may be object or array
    const usuarios = Array.isArray((data as any).usuarios) ? (data as any).usuarios[0] : (data as any).usuarios

    return NextResponse.json({ data: { id: data.id, nro_registro: data.nro_registro, fecha_matricula: data.fecha_matricula, curso_id: data.curso_id, usuarios } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
