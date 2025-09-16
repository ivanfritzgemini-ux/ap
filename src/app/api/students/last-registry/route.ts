import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  // Assume nro_registro is stored as a string but numeric/sequential.
  const { data, error } = await supabase
    .from('estudiantes_detalles')
    .select('nro_registro')
    .order('nro_registro', { ascending: false })
    .limit(1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const last = data && data[0]?.nro_registro ? data[0].nro_registro : null
  return NextResponse.json({ last })
}
