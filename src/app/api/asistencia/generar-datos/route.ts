import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    console.log('🌱 Generando datos de prueba para agosto 2025...')
    
    const supabase = createServiceRoleClient()
    
    // Obtener curso específico o el primer disponible
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('id, nivel, letra')
      .limit(5)
    
    if (cursosError || !cursos || cursos.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay cursos disponibles' 
      }, { status: 400 })
    }

    // Buscar el curso específico o usar el primero
    let cursoSeleccionado = cursos.find(c => c.id === '803d0ffc-6104-4902-939e-e36bc55319be') || cursos[0]
    
    console.log('📚 Curso seleccionado:', cursoSeleccionado)

    // Obtener estudiantes del curso
    const { data: estudiantes, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select('id')
      .limit(10) // Solo 10 estudiantes para la prueba
    
    if (estudiantesError || !estudiantes || estudiantes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay estudiantes disponibles' 
      }, { status: 400 })
    }

    console.log(`👥 ${estudiantes.length} estudiantes encontrados`)

    // Generar registros para la primera semana de agosto 2025
    const fechas = [
      '2025-08-01', // Viernes
      '2025-08-04', // Lunes  
      '2025-08-05', // Martes
      '2025-08-06', // Miércoles
      '2025-08-07', // Jueves
      '2025-08-08', // Viernes
    ]

    console.log('📅 Fechas a generar:', fechas)

    const registrosAInsertar = []

    // Generar registros para cada estudiante y cada fecha
    estudiantes.forEach((estudiante, estudianteIndex) => {
      fechas.forEach((fecha, fechaIndex) => {
        // Simular asistencia realista (90% presente)
        const presente = Math.random() > 0.1 // 90% de probabilidad de estar presente
        
        registrosAInsertar.push({
          estudiante_id: estudiante.id,
          curso_id: cursoSeleccionado.id,
          fecha: fecha,
          presente: presente,
          justificado: false,
          tipo_ausencia: presente ? null : 'injustificada',
          observaciones: `Datos de prueba - Estudiante ${estudianteIndex + 1}, Día ${fechaIndex + 1}`
        })
      })
    })

    console.log(`📝 ${registrosAInsertar.length} registros a insertar`)

    // Eliminar registros existentes para evitar conflictos
    console.log('🧹 Limpiando registros existentes...')
    await supabase
      .from('asistencia')
      .delete()
      .eq('curso_id', cursoSeleccionado.id)
      .gte('fecha', '2025-08-01')
      .lte('fecha', '2025-08-08')

    // Insertar registros por lotes
    console.log('💾 Insertando registros...')
    const batchSize = 20
    const resultados = []
    const errores = []

    for (let i = 0; i < registrosAInsertar.length; i += batchSize) {
      const lote = registrosAInsertar.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('asistencia')
        .insert(lote)
        .select()

      if (error) {
        console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error)
        errores.push(error)
      } else {
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} insertado: ${data.length} registros`)
        resultados.push(...data)
      }
    }

    // Verificar los datos insertados
    console.log('🔍 Verificando datos insertados...')
    const { data: verificacion, error: verificacionError } = await supabase
      .from('asistencia')
      .select(`
        id,
        estudiante_id,
        curso_id,
        fecha,
        presente,
        observaciones
      `)
      .eq('curso_id', cursoSeleccionado.id)
      .gte('fecha', '2025-08-01')
      .lte('fecha', '2025-08-08')
      .order('fecha', { ascending: true })

    if (verificacionError) {
      console.error('❌ Error verificando:', verificacionError)
    } else {
      console.log(`✅ Verificación: ${verificacion.length} registros encontrados`)
    }

    return NextResponse.json({
      success: true,
      message: 'Datos de prueba generados exitosamente',
      resultados: {
        curso: {
          ...cursoSeleccionado,
          nombre_curso: `${cursoSeleccionado.nivel || ''} ${cursoSeleccionado.letra || ''}`.trim()
        },
        estudiantes_usados: estudiantes.length,
        fechas_generadas: fechas,
        registros_insertados: resultados.length,
        errores_encontrados: errores.length,
        verificacion_final: verificacion?.length || 0,
        muestra_datos: verificacion?.slice(0, 5) || []
      },
      errores: errores
    })

  } catch (err: any) {
    console.error('💥 Error generando datos:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    }, { status: 500 })
  }
}