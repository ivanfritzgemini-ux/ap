import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { updateUserSchema } from '@/lib/validators/user'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      return NextResponse.json({ error: first.message, issues: parsed.error.errors }, { status: 400 })
    }

    const supabase = await createServerClient()
    // Allow partial updates - only include known fields
    const allowed = ['rut','nombres','apellidos','sexo_id','email','telefono','direccion','rol_id','status','fecha_nacimiento']
    const payload: any = {}
    for (const k of allowed) if (k in parsed.data) payload[k] = (parsed.data as any)[k]

    if (Object.keys(payload).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

    // Resolve sexo_id and rol_id labels to UUIDs if needed (client may send labels like 'masculino' or 'student')
    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F\-]{36,}$/.test(val)
    if ('sexo_id' in payload && payload.sexo_id && !isUuid(payload.sexo_id)) {
      const { data: sexoRow, error: sexoErr } = await supabase.from('sexo').select('id').ilike('nombre', payload.sexo_id).limit(1).maybeSingle()
      if (sexoErr) return NextResponse.json({ error: sexoErr.message }, { status: 500 })
      if (sexoRow && (sexoRow as any).id) payload.sexo_id = (sexoRow as any).id
    }
    if ('rol_id' in payload && payload.rol_id && !isUuid(payload.rol_id)) {
      const { data: rolRow, error: rolErr } = await supabase.from('roles').select('id,nombre_rol').ilike('nombre_rol', payload.rol_id).limit(1).maybeSingle()
      if (rolErr) return NextResponse.json({ error: rolErr.message }, { status: 500 })
      if (rolRow && (rolRow as any).id) payload.rol_id = (rolRow as any).id
    }

    const selectCols = `
      id,
      rut,
      nombres,
      apellidos,
      email,
      telefono,
      direccion,
      status,
      fecha_nacimiento,
      creado_en,
      actualizado_en,
      sexo_id,
      rol_id,
      sexo:sexo_id(nombre),
      rol:rol_id(nombre_rol)
    `

    const { data, error } = await supabase.from('usuarios').update(payload).eq('id', id).select(selectCols).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const u: any = data
    const mapped = {
      id: u.id,
      rut: u.rut,
      nombres: u.nombres,
      apellidos: u.apellidos,
      name: `${(u.apellidos || '').trim()} ${(u.nombres || '').trim()}`.trim(),
      email: u.email,
      telefono: u.telefono,
      direccion: u.direccion,
      status: u.status,
      fecha_nacimiento: u.fecha_nacimiento,
      creado_en: u.creado_en,
      actualizado_en: u.actualizado_en,
      sexo_id: u.sexo_id ?? null,
      rol_id: u.rol_id ?? null,
      gender: u.sexo?.nombre ?? null,
      role: u.rol?.nombre_rol ?? null,
    }

    return NextResponse.json({ data: mapped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createServerClient()
    // Prevent deletion of admin users: check role name
    const { data: existing, error: fetchErr } = await supabase.from('usuarios').select('id, rol:rol_id(nombre_rol)').eq('id', id).limit(1).maybeSingle()
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  const roleName = (existing as any)?.rol?.nombre_rol || ''
    if (String(roleName).toLowerCase() === 'administrador' || String(roleName).toLowerCase() === 'admin') {
      return NextResponse.json({ error: 'Cannot delete administrator users' }, { status: 403 })
    }

    // Try to delete from 'usuarios' first
    const { error: delError } = await supabase.from('usuarios').delete().eq('id', id)
    if (delError) {
      // If FK constraint prevents deletion, return 409
      if (delError.message && delError.message.toLowerCase().includes('foreign key')) {
        return NextResponse.json({ error: 'Cannot delete user: dependent records exist' }, { status: 409 })
      }
      return NextResponse.json({ error: delError.message }, { status: 500 })
    }

    // Also try to delete the auth user using service role client
    try {
      const adminClient = createServiceRoleClient()
      await adminClient.auth.admin.deleteUser(id)
    } catch (e) {
      // ignore; user may not exist in auth or deletion may fail
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
