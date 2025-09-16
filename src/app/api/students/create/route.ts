import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const {
    rut,
    nombres,
    apellidos,
    sexo_id,
    email,
    telefono,
    direccion,
    fecha_nacimiento,
    curso_id,
    nro_registro,
    fecha_matricula
  } = body

  if (!rut || !nro_registro) {
    return NextResponse.json({ error: 'Missing required fields: rut or nro_registro' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  try {
    // 1) If usuario with same RUT exists, reuse its id
    const { data: existing, error: existErr } = await supabase.from('usuarios').select('id').eq('rut', rut).limit(1).maybeSingle()
    if (existErr) {
      console.error('[api/students/create] error checking existing usuario:', existErr)
      return NextResponse.json({ error: existErr.message }, { status: 500 })
    }

    let userId: string | null = existing?.id ?? null

    // 2) If no existing usuario, create auth user and usuarios row
    if (!userId) {
      // create auth user using service role
      // Try to create auth user. If email already exists, attempt to find that auth user and reuse it.
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email ?? undefined,
        password: String(rut),
        user_metadata: { nombres, apellidos }
      } as any)

      if (authError) {
        console.error('[api/students/create] auth createUser error:', authError)
        // If email already exists, try to locate the auth user and reuse id
        if ((authError.code === 'email_exists' || authError.status === 422) && email) {
          try {
            const { data: listRes, error: listErr } = await supabase.auth.admin.listUsers({ query: email } as any)
            if (listErr) {
              console.error('[api/students/create] listUsers error:', listErr)
              return NextResponse.json({ error: authError.message }, { status: 500 })
            }
            const found = listRes?.users?.find((u: any) => u.email === email)
            if (found && found.id) {
              userId = found.id
            } else {
              return NextResponse.json({ error: 'Email already exists in auth but user not found via admin API' }, { status: 409 })
            }
          } catch (e: any) {
            console.error('[api/students/create] error finding existing auth user:', e)
            return NextResponse.json({ error: authError.message }, { status: 500 })
          }
        } else {
          return NextResponse.json({ error: authError.message }, { status: 500 })
        }
      } else {
        userId = authData.user?.id
        if (!userId) {
          return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
        }
      }

      // insert into usuarios with explicit id
      // determine a sensible default rol_id for new usuarios (prefer 'estudiante')
      let defaultRolId: string | null = null
      try {
        const { data: rolesData, error: rolesErr } = await supabase.from('roles').select('id,nombre_rol')
        if (rolesErr) {
          console.error('[api/students/create] error fetching roles:', rolesErr)
        } else if (Array.isArray(rolesData) && rolesData.length > 0) {
          const found = rolesData.find((r: any) => String(r.nombre_rol).toLowerCase().includes('estud'))
          defaultRolId = found?.id ?? rolesData[0].id
        }
      } catch (e) {
        console.error('[api/students/create] unexpected error fetching roles:', e)
      }

      const insertPayload: any = {
        id: userId,
        rut,
        nombres: nombres ?? null,
        apellidos: apellidos ?? null,
        sexo_id: sexo_id ?? null,
        email: email ?? null,
        telefono: telefono ?? null,
        direccion: direccion ?? null,
        fecha_nacimiento: fecha_nacimiento ?? null,
        rol_id: defaultRolId
      }

      const { data: userData, error: userError } = await supabase.from('usuarios').insert(insertPayload).select('id').limit(1)
      if (userError) {
        // rollback auth user
        try { await supabase.auth.admin.deleteUser(userId) } catch (e) { /* ignore */ }
        console.error('[api/students/create] insert usuarios error:', userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    }

    // 3) Insert into estudiantes_detalles (id = usuario id)
    const { data: studentData, error: studentError } = await supabase
      .from('estudiantes_detalles')
      .insert([{ id: userId, nro_registro, curso_id, fecha_matricula }])

    if (studentError) {
      console.error('[api/students/create] insert estudiantes_detalles error:', studentError)
      // if we created the usuario in this request (no existing before), attempt rollback
      if (!existing) {
        try { await supabase.from('usuarios').delete().eq('id', userId) } catch (e) { /* ignore */ }
        try { await supabase.auth.admin.deleteUser(userId) } catch (e) { /* ignore */ }
      }
      return NextResponse.json({ error: studentError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: userId })
  } catch (err: any) {
    console.error('[api/students/create] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
