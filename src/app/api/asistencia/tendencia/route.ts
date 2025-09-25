import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Endpoint para obtener tendencia de asistencia por meses con datos reales
export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // Obtener año escolar actual (marzo a diciembre del año actual)
    const fechaActual = new Date()
    let añoEscolar = fechaActual.getFullYear()
    
    if (fechaActual.getMonth() < 2) { // Enero o Febrero - usar año anterior
      añoEscolar = añoEscolar - 1
    }
    
    const fechaInicio = `${añoEscolar}-03-01`
    const fechaFin = `${añoEscolar}-12-31`
    
    // Obtener todos los registros de asistencia del año escolar actual
    const { data: registrosAsistencia, error: errorAsistencia } = await supabase
      .from('asistencia')
      .select('presente, fecha')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha')
    
    if (errorAsistencia) {
      console.error('Error obteniendo registros de asistencia:', errorAsistencia)
      return NextResponse.json({ 
        success: false, 
        error: errorAsistencia.message 
      }, { status: 500 })
    }
    
    if (!registrosAsistencia || registrosAsistencia.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: 'No hay datos de asistencia para este año escolar',
        tendencia: [],
        añoEscolar: añoEscolar
      })
    }
    
    // Agrupar por mes y calcular porcentajes
    const mesesData: { [key: string]: { total: number, presentes: number } } = {}
    
    registrosAsistencia.forEach(registro => {
      const fecha = new Date(registro.fecha)
      const mesAño = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      
      if (!mesesData[mesAño]) {
        mesesData[mesAño] = { total: 0, presentes: 0 }
      }
      
      mesesData[mesAño].total++
      if (registro.presente) {
        mesesData[mesAño].presentes++
      }
    })
    
    // Convertir a array y calcular porcentajes
    const tendenciaMeses = Object.entries(mesesData).map(([mesAño, datos]) => {
      const [año, mes] = mesAño.split('-')
      const mesNumero = parseInt(mes)
      const porcentaje = Math.round((datos.presentes / datos.total) * 100)
      
      // Nombres de los meses
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      
      return {
        mes: mesNumero,
        año: parseInt(año),
        nombre_mes: nombresMeses[mesNumero - 1],
        porcentaje: porcentaje,
        total_registros: datos.total,
        presentes: datos.presentes,
        diferencia: 0 // Se calculará después
      }
    }).sort((a, b) => {
      // Ordenar por año y mes
      if (a.año !== b.año) return a.año - b.año
      return a.mes - b.mes
    })
    
    // Calcular diferencias con respecto al mes anterior
    for (let i = 1; i < tendenciaMeses.length; i++) {
      tendenciaMeses[i].diferencia = tendenciaMeses[i].porcentaje - tendenciaMeses[i - 1].porcentaje
    }
    
    // Calcular estadísticas adicionales
    const promedioGeneral = tendenciaMeses.length > 0 
      ? Math.round(tendenciaMeses.reduce((sum, mes) => sum + mes.porcentaje, 0) / tendenciaMeses.length)
      : 0
    
    // Tendencia de los últimos 3 meses
    const ultimosTresMeses = tendenciaMeses.slice(-3)
    let tendenciaGeneral = 'estable'
    
    if (ultimosTresMeses.length >= 2) {
      const diferencias = ultimosTresMeses.slice(1).map(mes => mes.diferencia)
      const sumaPositivas = diferencias.filter(d => d > 0).reduce((sum, d) => sum + d, 0)
      const sumaNegativas = diferencias.filter(d => d < 0).reduce((sum, d) => sum + Math.abs(d), 0)
      
      if (sumaPositivas > sumaNegativas + 2) {
        tendenciaGeneral = 'al_alza'
      } else if (sumaNegativas > sumaPositivas + 2) {
        tendenciaGeneral = 'a_la_baja'
      }
    }
    
    // Mes con mejor y peor asistencia
    const mejorMes = tendenciaMeses.reduce((mejor, actual) => 
      actual.porcentaje > mejor.porcentaje ? actual : mejor
    , tendenciaMeses[0])
    
    const peorMes = tendenciaMeses.reduce((peor, actual) => 
      actual.porcentaje < peor.porcentaje ? actual : peor
    , tendenciaMeses[0])
    
    return NextResponse.json({
      success: true,
      tendencia: tendenciaMeses,
      estadisticas: {
        promedioGeneral,
        tendenciaGeneral,
        mejorMes: {
          nombre: mejorMes?.nombre_mes,
          porcentaje: mejorMes?.porcentaje
        },
        peorMes: {
          nombre: peorMes?.nombre_mes,
          porcentaje: peorMes?.porcentaje
        },
        totalMeses: tendenciaMeses.length
      },
      añoEscolar: añoEscolar
    })

  } catch (err: any) {
    console.error('Error en tendencia de asistencia:', err)
    return NextResponse.json({ 
      success: false,
      error: err.message 
    }, { status: 500 })
  }
}