import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/dashboard/attendance-stats - Obtener estadísticas de asistencia promedio
export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Calcular fechas
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Mes actual
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0)).toISOString()
    const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 1, 0, 0, 0)).toISOString()
    
    // Mes anterior
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const prevMonthStart = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0)).toISOString()
    const prevMonthEnd = new Date(Date.UTC(prevYear, prevMonth + 1, 1, 0, 0, 0)).toISOString()

    // Verificar si existe la tabla de asistencia
    const { data: tablesData } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'asistencia')

    if (!tablesData || tablesData.length === 0) {
      // Si no existe tabla de asistencia, usar datos simulados basados en patrones típicos
      const totalStudents = await supabase
        .from('estudiantes_detalles')
        .select('id', { count: 'exact', head: false })
        .eq('es_matricula_actual', true)
      
      const studentCount = totalStudents.count ?? 0
      
      // Generar estadísticas realistas de asistencia
      const currentAverage = 92.5 + (Math.random() * 5) // Entre 92.5% y 97.5%
      const prevAverage = 91.8 + (Math.random() * 5) // Entre 91.8% y 96.8%
      
      return NextResponse.json({
        currentAverage: Number(currentAverage.toFixed(1)),
        previousAverage: Number(prevAverage.toFixed(1)),
        change: Number((currentAverage - prevAverage).toFixed(1)),
        totalStudents: studentCount,
        isSimulated: true
      })
    }

    // Si existe la tabla de asistencia, calcular estadísticas reales
    
    // Asistencia promedio del mes actual
    const currentAttendanceRes = await supabase
      .from('asistencia')
      .select('presente', { count: 'exact', head: false })
      .gte('fecha', currentMonthStart)
      .lt('fecha', currentMonthEnd)

    const currentPresentRes = await supabase
      .from('asistencia')
      .select('presente', { count: 'exact', head: false })
      .gte('fecha', currentMonthStart)
      .lt('fecha', currentMonthEnd)
      .eq('presente', true)

    // Asistencia promedio del mes anterior
    const prevAttendanceRes = await supabase
      .from('asistencia')
      .select('presente', { count: 'exact', head: false })
      .gte('fecha', prevMonthStart)
      .lt('fecha', prevMonthEnd)

    const prevPresentRes = await supabase
      .from('asistencia')
      .select('presente', { count: 'exact', head: false })
      .gte('fecha', prevMonthStart)
      .lt('fecha', prevMonthEnd)
      .eq('presente', true)

    const currentTotal = currentAttendanceRes.count ?? 0
    const currentPresent = currentPresentRes.count ?? 0
    const prevTotal = prevAttendanceRes.count ?? 0
    const prevPresent = prevPresentRes.count ?? 0

    const currentAverage = currentTotal > 0 ? (currentPresent / currentTotal) * 100 : 0
    const previousAverage = prevTotal > 0 ? (prevPresent / prevTotal) * 100 : 0
    const change = currentAverage - previousAverage

    // Obtener total de estudiantes
    const totalStudentsRes = await supabase
      .from('estudiantes_detalles')
      .select('id', { count: 'exact', head: false })
      .eq('es_matricula_actual', true)

    return NextResponse.json({
      currentAverage: Number(currentAverage.toFixed(1)),
      previousAverage: Number(previousAverage.toFixed(1)),
      change: Number(change.toFixed(1)),
      totalStudents: totalStudentsRes.count ?? 0,
      isSimulated: false
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}