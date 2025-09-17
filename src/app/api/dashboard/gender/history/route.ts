import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

type MonthCount = { month: string; year: number; women: number; men: number }

export async function GET() {
  try {
    const supabase = await createServerClient()

    // We'll build counts for the last 12 months (including current)
    const now = new Date()
    const months: { label: string; idx: number; year: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ label: d.toLocaleString('es-CL', { month: 'short' }).replace('.', ''), idx: d.getMonth(), year: d.getFullYear() })
    }

    // Fetch estudiantes_detalles with fecha_matricula and sexo via usuarios relationship
    // We join alumnos via usuarios table to get sexo name if possible
    const { data: rows } = await supabase
      .from('estudiantes_detalles')
      .select('fecha_matricula, usuario:usuario_id(id, sexo:sexo_id(nombre))')

    const result: MonthCount[] = months.map((m) => ({ month: m.label, year: m.year, women: 0, men: 0 }))

    if (Array.isArray(rows)) {
      for (const r of rows as any[]) {
        const dateStr = r?.fecha_matricula
        if (!dateStr) continue
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) continue
        // Find matching month+year in result
        const idx = result.findIndex(rr => rr.month === d.toLocaleString('es-CL', { month: 'short' }).replace('.', '') && rr.year === d.getFullYear())
        if (idx === -1) continue
        const genderName = (r?.usuario?.sexo?.nombre || '').toString().toLowerCase()
        if (/muj|fem|female|woman/i.test(genderName)) result[idx].women++
        else if (/hom|masc|male|man/i.test(genderName)) result[idx].men++
      }
    }

    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
