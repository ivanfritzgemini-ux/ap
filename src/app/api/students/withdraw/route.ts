import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, fecha_retiro, motivo_retiro } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (!fecha_retiro) return NextResponse.json({ error: 'Missing fecha_retiro' }, { status: 400 })

    const supabase = createServiceRoleClient()
    const payload: any = { fecha_retiro: fecha_retiro }
    if (typeof motivo_retiro !== 'undefined') payload.motivo_retiro = motivo_retiro

    const { error } = await supabase.from('estudiantes_detalles').update(payload).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

