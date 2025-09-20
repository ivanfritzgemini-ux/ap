import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from('establecimientos').select('*').limit(1).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json()
    const svc = createServiceRoleClient()
    // upsert single establishment (no unique constraint provided; assume single row by id or create new)
    if (payload.id) {
      const { data, error } = await svc.from('establecimientos').update(payload).eq('id', payload.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    } else {
      const { data, error } = await svc.from('establecimientos').insert(payload).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
