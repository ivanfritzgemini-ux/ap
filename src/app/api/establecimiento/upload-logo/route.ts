import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as unknown as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const svc = createServiceRoleClient()
    const filename = `${Date.now()}-${(file as any).name}`
  const arrayBuffer = await file.arrayBuffer()
  // edge runtime doesn't have Buffer; use Uint8Array
  const uint8 = Uint8Array.from(new Uint8Array(arrayBuffer))

  const { data, error } = await svc.storage.from('app').upload(filename, uint8, { contentType: (file as any).type })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // get public url (supabase client returns { data: { publicUrl } })
  const pub = svc.storage.from('app').getPublicUrl(filename)
  const publicUrl = (pub as any)?.data?.publicUrl || undefined

  return NextResponse.json({ path: filename, publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
