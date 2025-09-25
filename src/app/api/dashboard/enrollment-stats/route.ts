import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/dashboard/enrollment-stats - Obtener estadísticas de matrícula del año actual
export async function GET() {
  try {
    const supabase = await createServerClient()
    const now = new Date()
    const year = now.getFullYear()

    // 1. Total de estudiantes únicos en la base de datos
    // SELECT COUNT(DISTINCT estudiante_id) AS unique_student_count FROM "estudiantes_detalles";
    const { data: allStudents, error: allStudentsError } = await supabase
      .from('estudiantes_detalles')
      .select('estudiante_id')
    
    if (allStudentsError) {
      return NextResponse.json({ error: allStudentsError.message }, { status: 500 })
    }
    
    // Contar estudiantes únicos manualmente
    const uniqueIds = new Set((allStudents || []).map(s => s.estudiante_id))
    const totalUniqueStudents = uniqueIds.size

    // 2. Contar retirados por cambio de establecimiento
    // SELECT COUNT(*) AS retirados FROM estudiantes_detalles WHERE motivo_retiro = 'Cambio de Establecimiento';
    const retirosRes = await supabase
      .from('estudiantes_detalles')
      .select('id', { count: 'exact', head: false })
      .eq('motivo_retiro', 'Cambio de Establecimiento')

    if (retirosRes.error) {
      return NextResponse.json({ error: retirosRes.error.message }, { status: 500 })
    }

    // 3. Ingresos nuevos después del 2025-03-03 (estudiantes con solo un registro)
    // Primero obtenemos todos los registros para hacer el análisis
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('estudiantes_detalles')
      .select('estudiante_id, fecha_matricula')

    let ingresosNuevos = 0
    if (allRecordsError) {
      return NextResponse.json({ error: allRecordsError.message }, { status: 500 })
    }

    if (allRecords && allRecords.length > 0) {
      // Contar registros por estudiante
      const registrosPorEstudiante = new Map()
      
      for (const record of allRecords) {
        const estudianteId = record.estudiante_id
        if (!registrosPorEstudiante.has(estudianteId)) {
          registrosPorEstudiante.set(estudianteId, [])
        }
        registrosPorEstudiante.get(estudianteId).push(record)
      }
      
      // Filtrar estudiantes que se matricularon después del 2025-03-03 y solo tienen un registro
      for (const [estudianteId, registros] of registrosPorEstudiante.entries()) {
        if (registros.length === 1) {
          const fechaMatricula = new Date(registros[0].fecha_matricula)
          const fechaCorte = new Date('2025-03-03')
          if (fechaMatricula > fechaCorte) {
            ingresosNuevos++
          }
        }
      }
    }

    const totalMatricula = totalUniqueStudents
    const retiros = retirosRes.count ?? 0
    const matriculaActual = totalMatricula - retiros

    return NextResponse.json({ 
      totalMatricula: matriculaActual,
      totalUniqueStudents: totalUniqueStudents,
      ingresos: ingresosNuevos, 
      retiros,
      year 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}