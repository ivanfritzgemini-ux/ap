import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET para generar datos simples de prueba
export async function GET() {
  try {
    console.log('🌱 Generando datos simples de prueba...')
    
    const supabase = createServiceRoleClient()
    
    // 1. Obtener primer curso disponible
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('id, nivel, letra')
      .limit(1)
    
    if (cursosError || !cursos || cursos.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay cursos disponibles',
        details: cursosError 
      }, { status: 400 })
    }

    const curso = cursos[0]
    console.log('📚 Usando curso:', curso)

    // 2. Obtener primeros estudiantes disponibles
    const { data: estudiantes, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select('id')
      .limit(3) // Solo 3 estudiantes para prueba simple
    
    if (estudiantesError || !estudiantes || estudiantes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay estudiantes disponibles',
        details: estudiantesError 
      }, { status: 400 })
    }

    console.log(`👥 Usando ${estudiantes.length} estudiantes`)

    // 3. Limpiar datos previos de prueba
    console.log('🧹 Limpiando datos previos...')
    await supabase
      .from('asistencia')
      .delete()
      .eq('curso_id', curso.id)
      .gte('fecha', '2025-08-01')
      .lte('fecha', '2025-08-05') // Solo 5 días

    // 4. Crear registros simples para agosto 2025
    const fechas = ['2025-08-01', '2025-08-02', '2025-08-05'] // Solo 3 días
    const registros: any[] = []

    estudiantes.forEach((estudiante) => {
      fechas.forEach((fecha) => {
        registros.push({
          estudiante_id: estudiante.id,
          curso_id: curso.id,
          fecha: fecha,
          presente: true, // Todos presentes para simplificar
          justificado: false,
          tipo_ausencia: null,
          observaciones: 'Datos de prueba simple'
        })
      })
    })

    console.log(`📝 Insertando ${registros.length} registros...`)

    // 5. Insertar registros
    const { data: insertResult, error: insertError } = await supabase
      .from('asistencia')
      .insert(registros)
      .select()

    if (insertError) {
      console.error('❌ Error insertando:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al insertar registros',
        details: insertError 
      }, { status: 500 })
    }

    console.log(`✅ ${insertResult.length} registros insertados`)

    // 6. Verificar que se pueden leer
    const { data: verificacion, error: verificacionError } = await supabase
      .from('asistencia')
      .select('*')
      .eq('curso_id', curso.id)
      .gte('fecha', '2025-08-01')
      .lte('fecha', '2025-08-05')
      .order('fecha', { ascending: true })

    if (verificacionError) {
      console.error('❌ Error verificando:', verificacionError)
    } else {
      console.log(`🔍 Verificación: ${verificacion.length} registros leídos`)
    }

    return NextResponse.json({
      success: true,
      message: 'Datos de prueba simples generados exitosamente',
      resultados: {
        curso_usado: {
          ...curso,
          nombre_curso: `${curso.nivel || ''} ${curso.letra || ''}`.trim()
        },
        estudiantes_usados: estudiantes.length,
        fechas_generadas: fechas,
        registros_insertados: insertResult.length,
        registros_verificados: verificacion?.length || 0,
        datos_muestra: verificacion?.slice(0, 3)
      },
      instrucciones: {
        curso_id: curso.id,
        mes: 8,
        año: 2025,
        url_verificacion: `/api/asistencia?cursoId=${curso.id}&mes=8&año=2025`
      }
    })

  } catch (err: any) {
    console.error('💥 Error:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    }, { status: 500 })
  }
}