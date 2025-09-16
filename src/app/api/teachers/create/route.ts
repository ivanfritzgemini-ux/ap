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
    fecha_contrato,
    numero_horas,
    especialidad
  } = body

  if (!rut) {
    return NextResponse.json({ error: 'Missing required field: rut' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  try {
    // 1) Check if usuario exists
    const { data: existing, error: existErr } = await supabase.from('usuarios').select('id').eq('rut', rut).limit(1).maybeSingle()
    if (existErr) {
      console.error('[api/teachers/create] error checking existing usuario:', existErr)
      return NextResponse.json({ error: existErr.message }, { status: 500 })
    }

    let userId: string | null = existing?.id ?? null

    // 2) If no existing usuario, create auth user and usuarios row
    if (!userId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email ?? undefined,
        password: String(rut),
        user_metadata: { nombres, apellidos }
      } as any)

      if (authError) {
        console.error('[api/teachers/create] auth createUser error:', authError)
        if ((authError.code === 'email_exists' || authError.status === 422) && email) {
          try {
            const { data: listRes, error: listErr } = await supabase.auth.admin.listUsers({ query: email } as any)
            if (listErr) {
              console.error('[api/teachers/create] listUsers error:', listErr)
              return NextResponse.json({ error: authError.message }, { status: 500 })
            }
            const found = listRes?.users?.find((u: any) => u.email === email)
            if (found && found.id) {
              userId = found.id
            } else {
              return NextResponse.json({ error: 'Email already exists in auth but user not found via admin API' }, { status: 409 })
            }
          } catch (e: any) {
            console.error('[api/teachers/create] error finding existing auth user:', e)
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
      // find default role for teachers if possible
      let defaultRolId: string | null = null
      try {
        const { data: rolesData, error: rolesErr } = await supabase.from('roles').select('id,nombre_rol')
        if (rolesErr) {
          console.error('[api/teachers/create] error fetching roles:', rolesErr)
        } else if (Array.isArray(rolesData) && rolesData.length > 0) {
          const found = rolesData.find((r: any) => String(r.nombre_rol).toLowerCase().includes('prof') || String(r.nombre_rol).toLowerCase().includes('teacher'))
          defaultRolId = found?.id ?? rolesData[0].id
        }
      } catch (e) {
        console.error('[api/teachers/create] unexpected error fetching roles:', e)
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
        try { await supabase.auth.admin.deleteUser(userId) } catch (e) { /* ignore */ }
        console.error('[api/teachers/create] insert usuarios error:', userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    }

    // 3) Upsert into profesores_detalles (id = usuario id)
    const detailsPayload: any = {
      id: userId,
      fecha_contrato: fecha_contrato ?? null,
      numero_horas: numero_horas ?? null,
      especialidad: especialidad ?? null
    }

    // Use upsert (on conflict id) to allow create or update
    const { data: detailsData, error: detailsErr } = await supabase.from('profesores_detalles').upsert(detailsPayload, { onConflict: 'id' }).select()
    if (detailsErr) {
      console.error('[api/teachers/create] upsert profesores_detalles error:', detailsErr)
      // if we created usuario here and there's an error, attempt rollback
      if (!existing) {
        try { await supabase.from('usuarios').delete().eq('id', userId) } catch (e) { /* ignore */ }
        try { await supabase.auth.admin.deleteUser(userId) } catch (e) { /* ignore */ }
      }
      return NextResponse.json({ error: detailsErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: userId })
  } catch (err: any) {
    console.error('[api/teachers/create] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
