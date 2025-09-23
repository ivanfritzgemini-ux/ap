import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// GET para verificar la estructura de las tablas
export async function GET() {
  try {
    console.log('🔍 Verificando estructura de tablas...')
    
    const supabase = createServiceRoleClient()
    
    const resultados: any = {
      cursos: null,
      estudiantes: null,
      asistencia: null
    }

    // 1. Verificar tabla cursos - obtener todas las columnas
    try {
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('*')
        .limit(1)

      if (cursosError) {
        resultados.cursos = { error: cursosError }
      } else {
        resultados.cursos = {
          success: true,
          columnas: cursosData?.[0] ? Object.keys(cursosData[0]) : [],
          muestra: cursosData?.[0] || null,
          total_registros: cursosData?.length || 0
        }
      }
    } catch (err) {
      resultados.cursos = { error: err }
    }

    // 2. Verificar tabla estudiantes_detalles
    try {
      const { data: estudiantesData, error: estudiantesError } = await supabase
        .from('estudiantes_detalles')
        .select('*')
        .limit(1)

      if (estudiantesError) {
        resultados.estudiantes = { error: estudiantesError }
      } else {
        resultados.estudiantes = {
          success: true,
          columnas: estudiantesData?.[0] ? Object.keys(estudiantesData[0]) : [],
          muestra: estudiantesData?.[0] || null,
          total_registros: estudiantesData?.length || 0
        }
      }
    } catch (err) {
      resultados.estudiantes = { error: err }
    }

    // 3. Verificar tabla asistencia
    try {
      const { data: asistenciaData, error: asistenciaError } = await supabase
        .from('asistencia')
        .select('*')
        .limit(1)

      if (asistenciaError) {
        resultados.asistencia = { error: asistenciaError }
      } else {
        resultados.asistencia = {
          success: true,
          columnas: asistenciaData?.[0] ? Object.keys(asistenciaData[0]) : [],
          muestra: asistenciaData?.[0] || null,
          total_registros: asistenciaData?.length || 0
        }
      }
    } catch (err) {
      resultados.asistencia = { error: err }
    }

    // 4. Intentar encontrar el nombre correcto de la columna de cursos
    const posiblesNombres = ['nombre', 'name', 'curso_nombre', 'title', 'descripcion']
    const columnasEncontradas: any = {}

    for (const nombreColumna of posiblesNombres) {
      try {
        const { data, error } = await supabase
          .from('cursos')
          .select(nombreColumna)
          .limit(1)

        if (!error && data) {
          columnasEncontradas[nombreColumna] = (data[0] as any)?.[nombreColumna] || 'valor_vacio'
        }
      } catch (err) {
        // Columna no existe, continuar
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Estructura de tablas verificada',
      tablas: resultados,
      posibles_columnas_cursos: columnasEncontradas,
      recomendacion: {
        problema: 'La columna "nombre_curso" no existe en la tabla cursos',
        solucion: 'Usar "nivel" + "letra" combinadas, como en /api/cursos: [nivel, letra].filter(Boolean).join(" ").trim()'
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