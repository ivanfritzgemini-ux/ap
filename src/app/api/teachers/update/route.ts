import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, rut, nombres, apellidos, sexo_id, email, telefono, direccion, fecha_nacimiento, fecha_contrato, numero_horas, especialidad } = body
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
      fecha_nacimiento: fecha_nacimiento ?? undefined
    }

    const { data: userData, error: userErr } = await supabase.from('usuarios').update(userPayload).eq('id', id).select('id').limit(1)
    if (userErr) {
      console.error('[api/teachers/update] update usuarios error:', userErr)
      return NextResponse.json({ error: userErr.message }, { status: 500 })
    }

    const detailsPayload: any = {
      fecha_contrato: fecha_contrato ?? undefined,
      numero_horas: numero_horas ?? undefined,
      especialidad: especialidad ?? undefined
    }

    const { data: detailsData, error: detailsErr } = await supabase.from('profesores_detalles').update(detailsPayload).eq('id', id).select('id').limit(1)
    if (detailsErr) {
      console.error('[api/teachers/update] update profesores_detalles error:', detailsErr)
      return NextResponse.json({ error: detailsErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error('[api/teachers/update] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
