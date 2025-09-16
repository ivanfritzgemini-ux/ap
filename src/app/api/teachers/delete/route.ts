import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { id, removeAuth } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceRoleClient()
  try {
    // Delete teacher details first to avoid FK constraint violation
    const { error: detailsErr } = await supabase.from('profesores_detalles').delete().eq('id', id)
    if (detailsErr) {
      console.error('[api/teachers/delete] failed deleting profesores_detalles:', detailsErr)
      return NextResponse.json({ error: detailsErr.message }, { status: 500 })
    }

    const { error: userErr } = await supabase.from('usuarios').delete().eq('id', id)
    if (userErr) {
      console.error('[api/teachers/delete] failed deleting usuario:', userErr)
      return NextResponse.json({ error: userErr.message }, { status: 500 })
    }

    if (removeAuth) {
      try {
        await supabase.auth.admin.deleteUser(id)
      } catch (e) {
        // non-fatal
        console.warn('[api/teachers/delete] failed removing auth user', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[api/teachers/delete] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
