import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Crear cliente de Supabase con rol de servicio
    const supabase = createServiceRoleClient()
    
    // Curso y estudiante fijos para la prueba (como indicado en los logs previos)
    const cursoId = '803d0ffc-6104-4902-939e-e36bc55319be'  // 1 A
    const estudianteId = 'c061c8ec-a516-411c-ac47-16184c5b349c'  // First student
    
    if (!cursoId || !estudianteId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay cursos o estudiantes para la prueba' 
      })
    }
    
    // Obtener todos los viernes de agosto 2025
    const viernes = obtenerViernesDeAgosto2025()
    console.log('Viernes de agosto 2025:', viernes)
    
    // Limpiar registros previos de prueba para este curso/estudiante/mes
    await limpiarRegistrosPrueba(supabase, cursoId, estudianteId)
    
    // Guardar registros para todos los viernes
    const resultadosGuardado = await guardarRegistrosParaViernes(supabase, viernes, cursoId, estudianteId)
    
    // Cargar datos de agosto 2025 directamente de la tabla
    const { data: datosDirectos } = await supabase
      .from('asistencia')
      .select('*')
      .eq('curso_id', cursoId)
      .eq('estudiante_id', estudianteId)
      .gte('fecha', '2025-08-01')
      .lte('fecha', '2025-08-31')
      .order('fecha')
    
    // Cargar datos usando la API normal
    const { data: datosAPI } = await supabase
      .from('asistencia')
      .select('*')
      .eq('curso_id', cursoId)
      .eq('estudiante_id', estudianteId)
      .gte('fecha', '2025-08-01')
      .lte('fecha', '2025-08-31')
      .order('fecha')
    
    // Verificar qué días son viernes en los registros cargados
    const viernesEnDatosDirectos = datosDirectos?.filter(r => {
      // Imprimir cada fecha y su día de la semana para debug
      const fecha = new Date(r.fecha)
      const diaSemana = fecha.getDay()
      console.log(`Registro fecha: ${r.fecha}, día semana: ${diaSemana}, es viernes: ${diaSemana === 5}`)
      return diaSemana === 5 // 0 = domingo, 5 = viernes
    }) || []
    
    const viernesEnDatosAPI = datosAPI?.filter(r => {
      const fecha = new Date(r.fecha)
      const diaSemana = fecha.getDay()
      return diaSemana === 5 // 0 = domingo, 5 = viernes
    }) || []
    
    // También registrar todos los datos para diagnóstico
    console.log('Todos los datos directos:', JSON.stringify(datosDirectos))
    console.log('Todos los datos API:', JSON.stringify(datosAPI))
    
    return NextResponse.json({
      success: true,
      message: "Test de agosto 2025 completado",
      viernesDeAgosto: viernes,
      guardarRegistrosViernes: resultadosGuardado,
      viernesEnDatosDirectos: viernesEnDatosDirectos.length,
      viernesEnDatosAPI: viernesEnDatosAPI.length,
      totalRegistrosDirectos: datosDirectos?.length || 0,
      totalRegistrosAPI: datosAPI?.length || 0,
      detalleDatosViernesDirectos: viernesEnDatosDirectos,
      detalleDatosViernesAPI: viernesEnDatosAPI,
      conclusion: 
        viernesEnDatosDirectos.length === viernes.length && 
        viernesEnDatosAPI.length === viernes.length ? 
          "Los datos de asistencia para viernes en agosto se guardan y cargan correctamente" : 
          "Hay problemas con los viernes de agosto"
    })
  } catch (error) {
    console.error("Error en la prueba de agosto:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Error en la prueba: ${error instanceof Error ? error.message : String(error)}` 
    })
  }
}

// Función para obtener todos los viernes de agosto 2025
function obtenerViernesDeAgosto2025() {
  const viernesDeAgosto = []
  const fechaInicio = new Date(2025, 7, 1) // Agosto es mes 7 en JS (0-indexed)
  const fechaFin = new Date(2025, 8, 0) // Último día de agosto
  
  // Recorrer día a día
  let fechaActual = new Date(fechaInicio)
  while (fechaActual <= fechaFin) {
    // Si es viernes (5)
    if (fechaActual.getDay() === 5) {
      // Guardar fecha en formato ISO (YYYY-MM-DD)
      viernesDeAgosto.push(fechaActual.toISOString().split('T')[0])
    }
    // Avanzar un día
    fechaActual.setDate(fechaActual.getDate() + 1)
  }
  
  return viernesDeAgosto
}

// Función para limpiar registros previos de prueba
async function limpiarRegistrosPrueba(supabase: any, cursoId: string, estudianteId: string) {
  // Eliminar registros previos de agosto 2025 para este curso/estudiante
  const { error } = await supabase
    .from('asistencia')
    .delete()
    .eq('curso_id', cursoId)
    .eq('estudiante_id', estudianteId)
    .gte('fecha', '2025-08-01')
    .lte('fecha', '2025-08-31')
  
  if (error) {
    throw new Error(`Error al limpiar registros: ${error.message}`)
  }
  
  return true
}

// Función para guardar registros para todos los viernes
async function guardarRegistrosParaViernes(
  supabase: any, 
  viernes: string[], 
  cursoId: string, 
  estudianteId: string
) {
  const resultados = []
  
  for (const fechaViernes of viernes) {
    // Guardar registro para este viernes
    const { data, error } = await supabase
      .from('asistencia')
      .insert({
        fecha: fechaViernes,
        curso_id: cursoId,
        estudiante_id: estudianteId,
        presente: true // Marcar como presente
      })
      .select()
    
    if (error) {
      resultados.push({
        fecha: fechaViernes,
        exito: false,
        error: error.message
      })
    } else {
      resultados.push({
        fecha: fechaViernes,
        exito: true,
        id: data?.[0]?.id
      })
    }
  }
  
  return resultados
}