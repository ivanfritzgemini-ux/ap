import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, rut, nombres, apellidos, sexo_id, email, telefono, direccion, fecha_nacimiento, rol_id } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceRoleClient()

  try {
    const userPayload: any = {
      rut: rut ?? undefined,
      nombres: nombres ?? undefined,
      apellidos: apellidos ?? undefined,
      sexo_id: sexo_id ?? undefined,
      email: email ?? undefined,
      telefono: telefono ?? undefined,
      direccion: direccion ?? undefined,
      fecha_nacimiento: fecha_nacimiento ?? undefined,
      rol_id: typeof rol_id === 'undefined' ? undefined : rol_id
    }

    const { data: userData, error: userErr } = await supabase.from('usuarios').update(userPayload).eq('id', id).select('id').limit(1)
    if (userErr) {
      console.error('[api/teachers/update] update usuarios error:', userErr)
      return NextResponse.json({ error: userErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error('[api/teachers/update] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
