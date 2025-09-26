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
    
    // Calcular fechas: desde el primer día del mes hasta el primer día del mes siguiente
    const from = new Date(Date.UTC(year, m, 1, 0, 0, 0)).toISOString() // YYYY-MM-DDTHH:mm:ss.sssZ formato
    const to = new Date(Date.UTC(year, m + 1, 1, 0, 0, 0)).toISOString() // Primer día del mes siguiente

    // Count ingresos: Para marzo usa consulta simple, otros meses usan lógica de duplicados
    let ingresos = 0

    if (month === 'mar') {
      // Para marzo: SELECT COUNT(DISTINCT estudiante_id) AS ingresos_mes FROM estudiantes_detalles WHERE fecha_matricula >= '2025-03-01'::timestamp AND fecha_matricula < '2025-04-01'::timestamp
      const { data: ingresosData, error: ingresosDataError } = await supabase
        .from('estudiantes_detalles')
        .select('estudiante_id')
        .gte('fecha_matricula', from)
        .lt('fecha_matricula', to)

      if (ingresosDataError) {
        return NextResponse.json({ error: ingresosDataError.message }, { status: 500 })
      }

      // Contar estudiantes únicos para marzo
      const estudiantesIngresosUnicos = new Set(ingresosData?.map(r => r.estudiante_id) || [])
      ingresos = estudiantesIngresosUnicos.size

    } else {
      // Para otros meses: Implementa la consulta CTE para excluir estudiantes duplicados
      // Primero obtenemos todos los registros para identificar duplicados
      const { data: allRecords, error: allRecordsError } = await supabase
        .from('estudiantes_detalles')
        .select('estudiante_id')

      if (allRecordsError) {
        return NextResponse.json({ error: allRecordsError.message }, { status: 500 })
      }

      // Identificar estudiantes con registros duplicados
      const studentCounts = new Map<number, number>()
      allRecords?.forEach(record => {
        const count = studentCounts.get(record.estudiante_id) || 0
        studentCounts.set(record.estudiante_id, count + 1)
      })
      
      const duplicatedStudentIds = new Set<number>()
      studentCounts.forEach((count, studentId) => {
        if (count > 1) {
          duplicatedStudentIds.add(studentId)
        }
      })

      // Obtener ingresos del mes excluyendo duplicados
      const { data: ingresosData, error: ingresosDataError } = await supabase
        .from('estudiantes_detalles')
        .select('estudiante_id')
        .gte('fecha_matricula', from)
        .lt('fecha_matricula', to)

      if (ingresosDataError) {
        return NextResponse.json({ error: ingresosDataError.message }, { status: 500 })
      }

      // Contar estudiantes únicos excluyendo duplicados
      const estudiantesIngresosUnicos = new Set()
      ingresosData?.forEach(record => {
        if (!duplicatedStudentIds.has(record.estudiante_id)) {
          estudiantesIngresosUnicos.add(record.estudiante_id)
        }
      })
      ingresos = estudiantesIngresosUnicos.size
    }

    // Count retiros: SELECT COUNT(DISTINCT estudiante_id) AS retirados_mes FROM estudiantes_detalles WHERE fecha_retiro >= '2025-03-01'::timestamp AND fecha_retiro < '2025-04-01'::timestamp AND motivo_retiro IS NOT NULL AND NOT (lower(motivo_retiro) = lower('Cambio de curso') OR lower(motivo_retiro) LIKE '%' || lower('Cambio de curso') || '%')
    const { data: retirosData, error: retirosDataError } = await supabase
      .from('estudiantes_detalles')
      .select('estudiante_id, motivo_retiro')
      .gte('fecha_retiro', from)
      .lt('fecha_retiro', to)
      .not('fecha_retiro', 'is', null)
      .not('motivo_retiro', 'is', null)

    if (retirosDataError) {
      return NextResponse.json({ error: retirosDataError.message }, { status: 500 })
    }



    // Filtrar retiros excluyendo "Cambio de curso" (case-insensitive y con LIKE)
    const retirosUnicos = new Set()
    retirosData?.forEach(record => {
      const motivo = record.motivo_retiro?.toLowerCase() || ''
      const esCambioCurso = motivo === 'cambio de curso' || motivo.includes('cambio de curso')
      if (!esCambioCurso) {
        retirosUnicos.add(record.estudiante_id)
      }
    })
    const retiros = retirosUnicos.size

    return NextResponse.json({ ingresos, retiros })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
