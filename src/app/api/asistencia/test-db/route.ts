import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    console.log('🧪 Iniciando prueba de base de datos...')
    
    const supabase = createServiceRoleClient()
    
    // Paso 1: Verificar conexión básica
    console.log('1️⃣ Verificando conexión...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('asistencia')
      .select('count', { count: 'exact', head: true })

    if (healthError) {
      console.error('❌ Error de conexión:', healthError)
      return NextResponse.json({ 
        success: false, 
        error: 'Conexión fallida', 
        details: healthError 
      }, { status: 500 })
    }
    
    console.log('✅ Conexión exitosa')

    // Paso 2: Obtener el primer curso y estudiante disponible para la prueba
    console.log('2️⃣ Obteniendo datos para prueba...')
    
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('id, nivel, letra')
      .limit(1)
    
    if (cursosError || !cursos || cursos.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay cursos disponibles para la prueba',
        details: cursosError 
      }, { status: 400 })
    }

    const cursoTest = cursos[0]
    console.log('📚 Curso para prueba:', cursoTest)

    const { data: estudiantes, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select('id')
      .limit(1)
    
    if (estudiantesError || !estudiantes || estudiantes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay estudiantes disponibles para la prueba',
        details: estudiantesError 
      }, { status: 400 })
    }

    const estudianteTest = estudiantes[0]
    console.log('👤 Estudiante para prueba:', estudianteTest)

    // Paso 3: Crear un registro de prueba
    console.log('3️⃣ Creando registro de prueba...')
    
    const fechaPrueba = '2025-09-22' // Hoy
    const registroPrueba = {
      estudiante_id: estudianteTest.id,
      curso_id: cursoTest.id,
      fecha: fechaPrueba,
      presente: true,
      justificado: false,
      tipo_ausencia: null,
      observaciones: 'Registro de prueba - creado automáticamente'
    }

    console.log('📝 Registro a insertar:', registroPrueba)

    // Primero, eliminar registro existente si existe
    await supabase
      .from('asistencia')
      .delete()
      .eq('estudiante_id', estudianteTest.id)
      .eq('fecha', fechaPrueba)

    // Insertar nuevo registro
    const { data: insertResult, error: insertError } = await supabase
      .from('asistencia')
      .insert(registroPrueba)
      .select()

    if (insertError) {
      console.error('❌ Error insertando:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al insertar registro de prueba',
        details: insertError 
      }, { status: 500 })
    }

    console.log('✅ Registro insertado:', insertResult)

    // Paso 4: Leer el registro recién creado
    console.log('4️⃣ Leyendo registro...')
    
    const { data: readResult, error: readError } = await supabase
      .from('asistencia')
      .select('*')
      .eq('estudiante_id', estudianteTest.id)
      .eq('fecha', fechaPrueba)

    if (readError) {
      console.error('❌ Error leyendo:', readError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error al leer registro',
        details: readError 
      }, { status: 500 })
    }

    console.log('📖 Registro leído:', readResult)

    // Paso 5: Probar consulta con filtros (como en la app)
    console.log('5️⃣ Probando consulta con filtros...')
    
    const { data: filteredResult, error: filteredError } = await supabase
      .from('asistencia')
      .select(`
        id,
        estudiante_id,
        curso_id,
        fecha,
        presente,
        justificado,
        tipo_ausencia,
        observaciones,
        created_at,
        updated_at
      `)
      .eq('curso_id', cursoTest.id)
      .gte('fecha', '2025-09-01')
      .lte('fecha', '2025-09-30')

    if (filteredError) {
      console.error('❌ Error en consulta filtrada:', filteredError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error en consulta filtrada',
        details: filteredError 
      }, { status: 500 })
    }

    console.log('🔍 Resultados filtrados:', filteredResult)

    // Paso 6: Limpiar registro de prueba
    console.log('6️⃣ Limpiando registro de prueba...')
    
    await supabase
      .from('asistencia')
      .delete()
      .eq('estudiante_id', estudianteTest.id)
      .eq('fecha', fechaPrueba)

    console.log('🧹 Limpieza completada')

    return NextResponse.json({
      success: true,
      message: 'Prueba de base de datos completada exitosamente',
      resultados: {
        curso_usado: cursoTest,
        estudiante_usado: estudianteTest,
        registro_insertado: insertResult,
        registro_leido: readResult,
        registros_filtrados: filteredResult?.length || 0,
        muestra_filtrados: filteredResult?.slice(0, 3)
      }
    })

  } catch (err: any) {
    console.error('💥 Error en prueba:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    }, { status: 500 })
  }
}