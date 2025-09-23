import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET simple para probar conexión básica
export async function GET() {
  try {
    console.log('🔍 Verificando conexión simple...')
    
    const supabase = createServiceRoleClient()
    
    // Prueba 1: Verificar que podemos conectar a Supabase
    const { data, error, count } = await supabase
      .from('asistencia')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Error de conexión:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    console.log('✅ Conexión exitosa, registros:', count)

    // Prueba 2: Obtener muestra de registros recientes
    const { data: sample, error: sampleError } = await supabase
      .from('asistencia')
      .select(`
        id,
        estudiante_id,
        curso_id,
        fecha,
        presente,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (sampleError) {
      console.error('⚠️ Error obteniendo muestra:', sampleError)
    }

    // Prueba 3: Verificar tabla de cursos
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('id, nivel, letra')
      .limit(3)

    if (cursosError) {
      console.error('⚠️ Error obteniendo cursos:', cursosError)
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión verificada exitosamente',
      servidor_funcionando: true,
      puerto: '9001',
      estadisticas: {
        total_registros_asistencia: count || 0,
        muestra_registros: sample || [],
        cursos_disponibles: cursos?.length || 0,
        cursos_muestra: cursos?.map(c => ({
          id: c.id,
          nombre_curso: `${c.nivel || ''} ${c.letra || ''}`.trim()
        })) || []
      },
      timestamp: new Date().toISOString()
    })

  } catch (err: any) {
    console.error('💥 Error en verificación:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    }, { status: 500 })
  }
}