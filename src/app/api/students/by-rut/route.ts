import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { formatRut } from '@/lib/utils'

function normalizeRutForSearch(input: string) {
  if (!input) return { cleaned: '', formatted: '' }
  const cleaned = input.replace(/[^0-9kK]/g, '').toUpperCase()
  const formatted = formatRut(input)
  return { cleaned, formatted }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rut = searchParams.get('rut')
  if (!rut) return NextResponse.json({ error: 'Missing rut' }, { status: 400 })

  const supabase = await createServerClient()
  const { cleaned, formatted } = normalizeRutForSearch(rut)

  // Try matching multiple possible stored formats: exact input, cleaned (digits+K), or formatted
  const orFilter = `rut.eq.${rut},rut.eq.${cleaned},rut.eq.${formatted}`
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, rut, nombres, apellidos, email, telefono, direccion, fecha_nacimiento, sexo_id')
    .or(orFilter)
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data ?? null })
}
