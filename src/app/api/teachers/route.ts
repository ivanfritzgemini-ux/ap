import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    // Query starting from profesores_detalles (so columns like profesores_detalles.fecha_contrato exist)
    const { data, error } = await supabase
      .from('profesores_detalles')
      .select(`
        id,
        fecha_contrato,
        especialidad,
        numero_horas,
        usuarios ( id, rut, nombres, apellidos, email, telefono, direccion, fecha_nacimiento, sexo:sexo_id(nombre), roles:roles(nombre_rol), sexo_id )
      `)

    if (error) {
      console.error('[api/teachers] supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalize rows: ensure profesores_detalles comes through as object/array
  const normalized = (data || []).map((row: any) => {
      // `row` corresponds to a profesores_detalles record; its users relation is in `usuarios`
      const user = Array.isArray(row.usuarios) ? row.usuarios[0] : row.usuarios
        return {
        id: user?.id ?? null,
        rut: user?.rut ?? null,
        nombres: user?.nombres ?? null,
        apellidos: user?.apellidos ?? null,
        name: [user?.nombres, user?.apellidos].filter(Boolean).join(' '),
        email: user?.email ?? null,
        telefono: user?.telefono ?? null,
        direccion: user?.direccion ?? null,
        fecha_nacimiento: user?.fecha_nacimiento ?? null,
        sexo_id: user?.sexo_id ?? null,
        gender: Array.isArray(user?.sexo) ? user.sexo[0]?.nombre : user?.sexo?.nombre,
        role: Array.isArray(user?.roles) ? user.roles[0]?.nombre_rol : user?.roles?.nombre_rol,
        teacher_details: {
          id: row.id,
          fecha_contrato: row.fecha_contrato,
          especialidad: row.especialidad,
          numero_horas: row.numero_horas,
        }
      }
    })

    if (id) {
      // try to find by user id (usuarios.id) or by profesores_detalles.id
      const found = normalized.find((r: any) => String(r.id) === String(id) || String(r.teacher_details?.id) === String(id))
      return NextResponse.json({ data: found ?? null })
    }

    return NextResponse.json({ data: normalized })
  } catch (err: any) {
    console.error('[api/teachers] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
