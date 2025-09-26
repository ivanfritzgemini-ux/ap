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

    // Obtener estudiantes activos con información de género agrupados por curso
    const { data: studentRows } = await supabase
      .from('estudiantes_detalles')
      .select(`
        curso_id,
        usuarios(sexo_id)
      `)
      .eq('es_matricula_actual', true)

    // IDs de género
    const FEMALE_ID = 'a96401ae-e227-4a1d-9978-d87faa1bb2c2'
    const MALE_ID = 'c871e0f9-ec4e-4039-9287-027340665d1c'

    // Contar estudiantes por curso y género
    const countsMap: Record<string, { total: number; masculinos: number; femeninos: number }> = {}
    
    if (Array.isArray(studentRows)) {
      for (const row of studentRows as any[]) {
        const key = String(row.curso_id)
        const usuario = Array.isArray(row.usuarios) ? row.usuarios[0] : row.usuarios
        const sexoId = usuario?.sexo_id
        
        if (!countsMap[key]) {
          countsMap[key] = { total: 0, masculinos: 0, femeninos: 0 }
        }
        
        countsMap[key].total++
        
        if (sexoId === MALE_ID) {
          countsMap[key].masculinos++
        } else if (sexoId === FEMALE_ID) {
          countsMap[key].femeninos++
        }
      }
    }

    // Construir datos para el gráfico
    const chartData = coursesData.map((course: any) => {
      const nivel = course.nivel ?? ''
      const letra = course.letra ?? ''
      const courseName = [nivel, letra].filter(Boolean).join(' ').trim() || 
                        course.nombre || 
                        `Curso ${course.id}`
      
      const courseStats = countsMap[String(course.id)] || { total: 0, masculinos: 0, femeninos: 0 }
      
      return {
        curso: courseName,
        estudiantes: courseStats.total,
        masculinos: courseStats.masculinos,
        femeninos: courseStats.femeninos,
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