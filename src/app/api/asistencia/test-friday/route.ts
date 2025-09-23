import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing Friday date logic...')
    
    const hoy = new Date()
    console.log('Fecha actual:', hoy.toISOString())
    
    // Test specific Friday dates in August 2025
    const fridayDates = [
      { date: '2025-08-01', day: 1 },
      { date: '2025-08-08', day: 8 },
      { date: '2025-08-15', day: 15 },
      { date: '2025-08-22', day: 22 },
      { date: '2025-08-29', day: 29 }
    ]
    
    const results = fridayDates.map(({ date, day }) => {
      // Use correct date construction to avoid timezone issues
      const fechaDia = new Date(2025, 8 - 1, day) // 2025, July (month 7 = August), day
      const diaSemana = fechaDia.getDay() // 0=domingo, 5=viernes, 6=sábado
      
      // Frontend logic
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6
      const esFeriado = false // No holidays in our test
      const esHabil = !esFinDeSemana && !esFeriado
      
      // Date enabled logic
      const hoyComparison = new Date()
      hoyComparison.setHours(23, 59, 59, 999)
      const esFechaHabilitada = fechaDia <= hoyComparison
      
      return {
        fecha: date,
        dia: day,
        diaSemana: diaSemana,
        nombreDia: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana],
        esFinDeSemana,
        esFeriado,
        esHabil,
        esFechaHabilitada,
        puedeMarcarAsistencia: esHabil && esFechaHabilitada
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Test de lógica de viernes completado',
      fechaActual: hoy.toISOString(),
      resultados: results,
      resumen: {
        viernesHabiles: results.filter(r => r.esHabil).length,
        viernesHabilitados: results.filter(r => r.esFechaHabilitada).length,
        viernesPuedenMarcar: results.filter(r => r.puedeMarcarAsistencia).length
      }
    })
    
  } catch (error: any) {
    console.error('Error en test-friday:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}