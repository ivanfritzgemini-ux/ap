import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Endpoint de prueba para verificar conectividad y datos de asistencia
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const test = searchParams.get('test') || 'connection'

    const supabase = createServiceRoleClient()
    
    if (test === 'connection') {
      // Probar conexión básica - usar una consulta simple
      const { data, error, count } = await supabase
        .from('asistencia')
        .select('id', { count: 'exact', head: true })

      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          details: error 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Conexión exitosa',
        total_records: count || 0
      })
    }

    if (test === 'sample') {
      // Obtener una muestra de datos
      const { data, error } = await supabase
        .from('asistencia')
        .select(`
          id,
          estudiante_id,
          curso_id,
          fecha,
          presente,
          justificado,
          created_at
        `)
        .limit(5)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          details: error 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `Se encontraron ${data.length} registros`,
        data: data 
      })
    }

    if (test === 'tables') {
      // Verificar qué tablas existen
      const { data, error } = await supabase
        .rpc('get_table_names')
        .single()

      // Si no existe esa función, intentar con una consulta simple
      if (error) {
        // Intentar obtener datos de diferentes tablas
        const tests = {
          asistencia: false,
          estudiantes_detalles: false,
          cursos: false,
          usuarios: false
        }

        for (const tabla of Object.keys(tests)) {
          try {
            await supabase.from(tabla).select('id').limit(1)
            tests[tabla as keyof typeof tests] = true
          } catch (e) {
            tests[tabla as keyof typeof tests] = false
          }
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Verificación de tablas',
          tables: tests
        })
      }

      return NextResponse.json({ 
        success: true, 
        data: data 
      })
    }

    return NextResponse.json({ 
      error: 'Parámetro test inválido. Use: connection, sample, o tables' 
    }, { status: 400 })

  } catch (err: any) {
    console.error('Error en test endpoint:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message || 'Error interno del servidor',
      stack: err.stack 
    }, { status: 500 })
  }
}