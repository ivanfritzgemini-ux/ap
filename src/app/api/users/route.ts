import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createUserSchema } from '@/lib/validators/user'

// GET /api/users -> list users from 'usuarios' table
export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()
    const url = new URL(req.url)
    const search = url.searchParams.get('search') || undefined

    // select specific columns and include related names from sexo and roles
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

    let query
    if (search) {
      // search in nombres, apellidos or email
      const like = `%${search}%`
      query = supabase.from('usuarios').select(selectCols).or(`nombres.ilike.${like},apellidos.ilike.${like},email.ilike.${like}`)
    } else {
      query = supabase.from('usuarios').select(selectCols)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Map DB rows to API shape: include concatenated name and readable sexo/role
    const mapped = (data || []).map((u: any) => ({
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
    }))

    return NextResponse.json({ data: mapped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// POST /api/users -> create user in auth (service role) and insert into 'usuarios'
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.errors[0]
      return NextResponse.json({ error: first.message, issues: parsed.error.errors }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Resolve sexo_id and rol_id if labels were provided (accept either UUID or label)
    let sexoId = body.sexo_id
    let rolId = body.rol_id

    const isUuid = (val: any) => typeof val === 'string' && /^[0-9a-fA-F-]{36,}$/.test(val)

    if (!isUuid(sexoId)) {
      // try to find in sexo table by nombre or key
      const { data: sexoRow } = await supabase.from('sexo').select('id').ilike('nombre', sexoId).limit(1).single()
      if (sexoRow && sexoRow.id) sexoId = sexoRow.id
    }

    if (!isUuid(rolId)) {
      // try to find in roles table by nombre or key
      const { data: rolRow } = await supabase.from('roles').select('id').ilike('nombre_rol', rolId).limit(1).single()
      if (rolRow && rolRow.id) rolId = rolRow.id
    }

    // 1) Create auth user using service role and set password = rut (as requested)
    // Use the server service-role client for admin actions
    const adminClient = createServiceRoleClient()
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: String(body.rut),
      user_metadata: { nombres: body.nombres, apellidos: body.apellidos }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const userId = authUser.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
    }

    // 2) Insert into 'usuarios' with the same id
    const insertPayload = {
      id: userId,
      rut: body.rut,
      nombres: body.nombres,
      apellidos: body.apellidos,
      sexo_id: sexoId,
      email: body.email,
      telefono: body.telefono || null,
      direccion: body.direccion || null,
      rol_id: rolId,
      status: typeof body.status === 'boolean' ? body.status : true,
      fecha_nacimiento: body.fecha_nacimiento
    }

    // Insert and return the full mapped user (including related sexo and role names)
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

    const { data, error } = await supabase.from('usuarios').insert(insertPayload).select(selectCols).single()
    if (error) {
      // Attempt to rollback auth user if insert failed
      try { await adminClient.auth.admin.deleteUser(userId) } catch (e) { /* ignore */ }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

    return NextResponse.json({ data: mapped }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
