import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceRoleClient()
  try {
    // Eliminar todas las matrículas del estudiante
    const { error } = await supabase.from('estudiantes_detalles').delete().eq('estudiante_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Optionally, you could also delete the usuarios row or keep it.
    // await supabase.from('usuarios').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
