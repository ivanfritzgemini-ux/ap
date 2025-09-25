import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/dashboard/students-by-course - Obtener estudiantes agrupados por curso para gráfico
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Obtener cursos y contar estudiantes activos
    const { data: coursesData } = await supabase.from('cursos').select('*')
    
    if (!coursesData || coursesData.length === 0) {
      return NextResponse.json([])
    }

    // Obtener estudiantes activos agrupados por curso
    const { data: studentRows } = await supabase
      .from('estudiantes_detalles')
      .select('curso_id')
      .eq('es_matricula_actual', true)

    // Contar estudiantes por curso
    const countsMap: Record<string, number> = {}
    if (Array.isArray(studentRows)) {
      for (const row of studentRows as any[]) {
        const key = String(row.curso_id)
        countsMap[key] = (countsMap[key] || 0) + 1
      }
    }

    // Construir datos para el gráfico
    const chartData = coursesData.map((course: any) => {
      const nivel = course.nivel ?? ''
      const letra = course.letra ?? ''
      const courseName = [nivel, letra].filter(Boolean).join(' ').trim() || 
                        course.nombre || 
                        `Curso ${course.id}`
      
      return {
        curso: courseName,
        estudiantes: countsMap[String(course.id)] ?? 0,
        cursoId: course.id
      }
    }).sort((a, b) => {
      // Ordenar por nivel y letra para mejor visualización
      const parseLevel = (name: string) => {
        const match = name.match(/(\d+)/)
        return match ? parseInt(match[1]) : 999
      }
      return parseLevel(a.curso) - parseLevel(b.curso)
    })

    return NextResponse.json(chartData)

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}