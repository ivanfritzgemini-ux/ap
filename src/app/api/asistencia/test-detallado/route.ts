import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Crear cliente de Supabase con rol de servicio
    const supabase = createServiceRoleClient()
    
    // Curso y estudiante fijos para la prueba (como indicado en los logs previos)
    const cursoId = '803d0ffc-6104-4902-939e-e36bc55319be'  // 1 A
    const estudianteId = 'c061c8ec-a516-411c-ac47-16184c5b349c'  // First student
    
    // Prueba simplificada pero más exhaustiva
    const debug = {
      fechasPrueba: [],
      insertResult: [],
      readResults: []
    }
    
    // Crear registros para todos los días de agosto (1-31)
    for (let dia = 1; dia <= 31; dia++) {
      const fecha = `2025-08-${dia.toString().padStart(2, '0')}`
      debug.fechasPrueba.push(fecha)
      
      // Verificar si es viernes
      const esViernes = new Date(fecha).getDay() === 5
      
      // Limpiar registro existente
      await supabase
        .from('asistencia')
        .delete()
        .eq('curso_id', cursoId)
        .eq('estudiante_id', estudianteId)
        .eq('fecha', fecha)
      
      // Insertar nuevo registro
      const { data: insertData, error: insertError } = await supabase
        .from('asistencia')
        .insert({
          fecha: fecha,
          curso_id: cursoId,
          estudiante_id: estudianteId,
          presente: true
        })
        .select()
      
      debug.insertResult.push({
        fecha,
        diaSemana: new Date(fecha).getDay(),
        esViernes,
        insertSuccess: !insertError,
        insertError: insertError?.message
      })
      
      // Leer el registro recién creado
      const { data: readData, error: readError } = await supabase
        .from('asistencia')
        .select('*')
        .eq('curso_id', cursoId)
        .eq('estudiante_id', estudianteId)
        .eq('fecha', fecha)
      
      if (readData && readData.length > 0) {
        const readFecha = new Date(readData[0].fecha)
        const readDiaSemana = readFecha.getDay()
        const readEsViernes = readDiaSemana === 5
        
        debug.readResults.push({
          fecha,
          registroLeido: true,
          readFecha: readData[0].fecha,
          readDiaSemana,
          readEsViernes,
          readMatchViernes: esViernes === readEsViernes
        })
      } else {
        debug.readResults.push({
          fecha,
          registroLeido: false,
          error: readError?.message
        })
      }
    }
    
    // Contar los viernes
    const viernesInsertados = debug.insertResult.filter(r => r.esViernes).length
    const viernesLeidos = debug.readResults.filter(r => r.readEsViernes).length
    
    return NextResponse.json({
      success: true,
      message: "Test detallado de agosto completado",
      viernesInsertados,
      viernesLeidos,
      viernesCoinciden: viernesInsertados === viernesLeidos,
      debug
    })
  } catch (error) {
    console.error("Error en la prueba detallada:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Error en la prueba detallada: ${error instanceof Error ? error.message : String(error)}` 
    })
  }
}