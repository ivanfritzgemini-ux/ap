import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, rut, nombres, apellidos, sexo_id, email, telefono, direccion, fecha_nacimiento, curso_id, fecha_matricula } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceRoleClient()

  try {
    // update usuarios (id = id)
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
      console.error('[api/students/update] update usuarios error:', userErr)
      return NextResponse.json({ error: userErr.message }, { status: 500 })
    }

    // update estudiantes_detalles but DO NOT modify nro_registro here
    const studentPayload: any = {
      curso_id: course_id_if_present(curso_id),
      fecha_matricula: fecha_matricula ?? undefined
    }

    const { data: studentData, error: studentErr } = await supabase.from('estudiantes_detalles').update(studentPayload).eq('id', id).select('id').limit(1)
    if (studentErr) {
      console.error('[api/students/update] update estudiantes_detalles error:', studentErr)
      return NextResponse.json({ error: studentErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error('[api/students/update] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

function course_id_if_present(c: any) {
  if (typeof c === 'undefined') return undefined
  return c
}
