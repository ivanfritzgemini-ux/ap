import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET - Obtener estudiantes con 100% de asistencia en un mes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')
    
    if (!mes || !año) {
      return NextResponse.json({ error: 'Se requieren los parámetros mes y año' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    
    // Obtener el primer y último día del mes
    const primerDia = `${año}-${mes.padStart(2, '0')}-01`
    const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0]
    
    // 1. Obtener todos los días hábiles del mes (lunes a viernes)
    const diasHabiles = []
    const diasEnMes = new Date(parseInt(año), parseInt(mes), 0).getDate()
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, dia)
      const diaSemana = fecha.getDay() // 0 = domingo, 6 = sábado
      
      // Solo incluir días de lunes a viernes
      if (diaSemana > 0 && diaSemana < 6) {
        const fechaStr = fecha.toISOString().split('T')[0]
        diasHabiles.push(fechaStr)
      }
    }

    // 2. Obtener todos los estudiantes activos y sus cursos
    const { data: estudiantes, error: errorEstudiantes } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        curso_id,
        fecha_matricula,
        fecha_retiro,
        usuarios (
          nombres,
          apellidos
        ),
        cursos (
          id,
          nivel,
          letra
        )
      `)
    
    if (errorEstudiantes) {
      console.error('Error al obtener estudiantes:', errorEstudiantes)
      return NextResponse.json({ error: errorEstudiantes.message }, { status: 500 })
    }

    // 3. Obtener todos los registros de asistencia para el mes seleccionado
    const { data: registrosAsistencia, error: errorAsistencia } = await supabase
      .from('asistencia')
      .select('fecha, estudiante_id, presente')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia)
      .eq('presente', true)
    
    if (errorAsistencia) {
      console.error('Error al obtener asistencia:', errorAsistencia)
      return NextResponse.json({ error: errorAsistencia.message }, { status: 500 })
    }

    // 4. Agrupar registros de asistencia por estudiante
    const asistenciaPorEstudiante: Record<string, Set<string>> = {}
    
    registrosAsistencia?.forEach(registro => {
      if (!asistenciaPorEstudiante[registro.estudiante_id]) {
        asistenciaPorEstudiante[registro.estudiante_id] = new Set()
      }
      asistenciaPorEstudiante[registro.estudiante_id].add(registro.fecha)
    })

    // 5. Encontrar estudiantes con 100% de asistencia
    const estudiantesPerfectos = []
    
    for (const estudiante of estudiantes || []) {
      // Calcular los días en que el estudiante debería haber asistido
      const diasObligatorios = diasHabiles.filter(fecha => {
        const fechaDia = new Date(fecha)
        const fechaMatricula = estudiante.fecha_matricula ? new Date(estudiante.fecha_matricula) : null
        const fechaRetiro = estudiante.fecha_retiro ? new Date(estudiante.fecha_retiro) : null
        
        // Verificar que el estudiante estaba matriculado en esta fecha
        if (fechaMatricula && fechaDia < fechaMatricula) return false
        if (fechaRetiro && fechaDia > fechaRetiro) return false
        
        return true
      })
      
      // Si no hay días obligatorios para este estudiante, continuar con el siguiente
      if (diasObligatorios.length === 0) continue
      
      // Verificar asistencia del estudiante para los días obligatorios
      const diasPresente = asistenciaPorEstudiante[estudiante.id] || new Set()
      const asistenciaPerfecta = diasObligatorios.every(fecha => diasPresente.has(fecha))
      
      // Solo incluir estudiantes con asistencia perfecta y al menos 1 día obligatorio
      if (asistenciaPerfecta && diasObligatorios.length > 0) {
        // Obtener el nombre completo del estudiante
        const usuario = Array.isArray(estudiante.usuarios) ? estudiante.usuarios[0] : estudiante.usuarios;
        const nombreCompleto = `${usuario?.apellidos || ''} ${usuario?.nombres || ''}`.trim();
        
        // Obtener el nombre del curso
        const curso = Array.isArray(estudiante.cursos) ? estudiante.cursos[0] : estudiante.cursos;
        const nombreCurso = curso ? `${curso.nivel}° ${curso.letra}` : 'Sin curso';
        
        estudiantesPerfectos.push({
          id: estudiante.id,
          nombre: nombreCompleto,
          curso_id: estudiante.curso_id,
          nombre_curso: nombreCurso,
          dias_asistidos: diasPresente.size,
          total_dias_obligatorios: diasObligatorios.length
        })
      }
    }

    return NextResponse.json({
      mes: parseInt(mes),
      año: parseInt(año),
      total_dias_habiles: diasHabiles.length,
      estudiantes_perfectos: estudiantesPerfectos,
      total: estudiantesPerfectos.length
    })
  } catch (err: any) {
    console.error('Error en GET /api/asistencia/perfecta:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}