import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { id, removeAuth } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createServiceRoleClient()
  try {
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
