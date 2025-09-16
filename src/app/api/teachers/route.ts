import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Query starting from profesores_detalles (so columns like profesores_detalles.fecha_contrato exist)
    const { data, error } = await supabase
      .from('profesores_detalles')
      .select(`
        id,
        fecha_contrato,
        especialidad,
        numero_horas,
        usuarios ( id, rut, nombres, apellidos, email, sexo:sexo_id(nombre), roles:roles(nombre_rol) )
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

    return NextResponse.json({ data: normalized })
  } catch (err: any) {
    console.error('[api/teachers] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
