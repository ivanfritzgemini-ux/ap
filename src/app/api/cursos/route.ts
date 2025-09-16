import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    // Select all columns and include the related tipo_educacion.nombre to be tolerant
    // try ordering by nivel; if column doesn't exist, retry without ordering
    let data: any = null
    let error: any = null
    try {
      const res = await supabase
        .from('cursos')
        .select('*, tipo_educacion:tipo_educacion_id(nombre)')
        .order('nivel')
      data = res.data
      error = res.error
      if (error && error.code === '42703') {
        console.warn('[api/cursos] nivel column not found, retrying without order')
        const res2 = await supabase
          .from('cursos')
          .select('*, tipo_educacion:tipo_educacion_id(nombre)')
        data = res2.data
        error = res2.error
      }
    } catch (e: any) {
      console.error('[api/cursos] unexpected supabase error:', e)
      return NextResponse.json({ error: e.message || 'Supabase error' }, { status: 500 })
    }
    if (error) {
      console.error('[api/cursos] supabase error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/cursos] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
