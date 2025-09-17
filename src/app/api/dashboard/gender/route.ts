import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Find student role if available
    const rolesRes = (await supabase.from('roles').select('id,nombre_rol')).data as any[]
    const studentRole = (rolesRes || []).find((r: any) => /estud|student|alumn/i.test(String(r.nombre_rol).toLowerCase()))

    let usersQuery = supabase.from('usuarios').select('id,sexo:sexo_id(nombre)')
    if (studentRole && studentRole.id) {
      usersQuery = usersQuery.eq('rol_id', studentRole.id)
    }

    const { data: usersRows } = await usersQuery

    let women = 0
    let men = 0
    if (Array.isArray(usersRows)) {
      for (const u of usersRows as any[]) {
        const genderName = (u.sexo?.nombre || '').toString().toLowerCase()
        if (/muj|fem|female|woman/i.test(genderName)) women++
        else if (/hom|masc|male|man/i.test(genderName)) men++
      }
    }

    return NextResponse.json({ women, men })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
