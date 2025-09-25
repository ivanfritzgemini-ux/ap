import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/dashboard/movements?month=ago (month is short Spanish month key like 'ene','feb',... 'ago')
export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()
    const url = new URL(req.url)
    const month = (url.searchParams.get('month') || '').toString().toLowerCase()

    // Map short month keys to month index (0-11)
    const map: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
    }
    const m = map[month]
    if (typeof m !== 'number') {
      return NextResponse.json({ error: 'Invalid or missing month parameter' }, { status: 400 })
    }

    // Build date range for the requested month in the current year
    const now = new Date()
    const year = now.getFullYear()
    
    // Calcular el último día del mes correctamente
    const lastDayOfMonth = new Date(Date.UTC(year, m + 1, 0)).getDate()
    const from = new Date(Date.UTC(year, m, 1, 0, 0, 0)).toISOString().split('T')[0] // YYYY-MM-DD formato
    const to = new Date(Date.UTC(year, m, lastDayOfMonth, 23, 59, 59)).toISOString().split('T')[0] // YYYY-MM-DD formato

    // Count ingresos: SELECT COUNT(*) AS matriculados_marzo FROM estudiantes_detalles WHERE fecha_matricula BETWEEN '2025-03-01' AND '2025-03-31'
    const ingresosRes = await supabase
      .from('estudiantes_detalles')
      .select('id', { count: 'exact', head: false })
      .gte('fecha_matricula', from)
      .lte('fecha_matricula', to)

    if (ingresosRes.error) {
      return NextResponse.json({ error: ingresosRes.error.message }, { status: 500 })
    }

    // Count retiros: SELECT COUNT(*) AS retirados_marzo FROM estudiantes_detalles WHERE fecha_retiro BETWEEN '2025-03-01' AND '2025-03-31' AND motivo_retiro <> 'Cambio de curso'
    const retirosRes = await supabase
      .from('estudiantes_detalles')
      .select('id', { count: 'exact', head: false })
      .gte('fecha_retiro', from)
      .lte('fecha_retiro', to)
      .not('fecha_retiro', 'is', null)
      .neq('motivo_retiro', 'Cambio de curso')

    if (retirosRes.error) {
      return NextResponse.json({ error: retirosRes.error.message }, { status: 500 })
    }

    const ingresos = ingresosRes.count ?? 0
    const retiros = retirosRes.count ?? 0

    return NextResponse.json({ ingresos, retiros })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
