import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Endpoint para obtener información resumida de datos disponibles
export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // 1. Obtener resumen por mes/año
    const { data: resumenMeses, error: errorMeses } = await supabase
      .from('asistencia')
      .select(`
        fecha,
        curso_id
      `)
      .order('fecha', { ascending: false })
      .limit(100)

    if (errorMeses) {
      return NextResponse.json({ 
        success: false, 
        error: errorMeses.message 
      }, { status: 500 })
    }

    // Procesar datos por mes/año
    const resumenPorMes: Record<string, any> = {}
    const cursos = new Set()

    resumenMeses?.forEach(registro => {
      const fecha = new Date(registro.fecha)
      const año = fecha.getFullYear()
      const mes = fecha.getMonth() + 1
      const clave = `${año}-${mes.toString().padStart(2, '0')}`
      
      if (!resumenPorMes[clave]) {
        resumenPorMes[clave] = {
          año,
          mes,
          registros: 0,
          cursos: new Set()
        }
      }
      
      resumenPorMes[clave].registros++
      resumenPorMes[clave].cursos.add(registro.curso_id)
      cursos.add(registro.curso_id)
    })

    // Convertir Sets a arrays
    Object.keys(resumenPorMes).forEach(clave => {
      resumenPorMes[clave].cursos = Array.from(resumenPorMes[clave].cursos)
    })

    // 2. Obtener información de cursos
    const { data: infoCursos, error: errorCursos } = await supabase
      .from('cursos')
      .select('id, nombre_curso')
      .in('id', Array.from(cursos))

    const mapaCursos: Record<string, string> = {}
    infoCursos?.forEach(curso => {
      mapaCursos[curso.id] = curso.nombre_curso
    })

    // 3. Obtener datos específicos del curso que aparece en los logs
    const cursoTest = '803d0ffc-6104-4902-939e-e36bc55319be'
    const { data: datosAgosto, error: errorAgosto } = await supabase
      .from('asistencia')
      .select(`
        fecha,
        estudiante_id,
        presente
      `)
      .eq('curso_id', cursoTest)
      .gte('fecha', '2025-08-01')
      .lte('fecha', '2025-08-31')
      .limit(10)

    return NextResponse.json({
      success: true,
      resumen: {
        total_meses_con_datos: Object.keys(resumenPorMes).length,
        meses_disponibles: resumenPorMes,
        cursos_con_datos: Object.keys(mapaCursos).length,
        info_cursos: mapaCursos
      },
      ejemplo_agosto_2025: {
        curso_id: cursoTest,
        registros_encontrados: datosAgosto?.length || 0,
        muestra: datosAgosto?.slice(0, 5)
      }
    })

  } catch (err: any) {
    console.error('Error en resumen endpoint:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message 
    }, { status: 500 })
  }
}