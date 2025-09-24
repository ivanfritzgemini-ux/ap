import { NextResponse } from 'next/server'
import { validarDiaBloqueado, obtenerInfoCurso, validarMultiplesFechas } from '@/lib/dias-bloqueados'

// GET - Validar si un día está bloqueado
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const fecha = url.searchParams.get('fecha')
    const cursoId = url.searchParams.get('cursoId')
    const fechas = url.searchParams.get('fechas') // Para validar múltiples fechas separadas por coma

    if (!fecha && !fechas) {
      return NextResponse.json({ 
        error: 'Se requiere el parámetro fecha o fechas' 
      }, { status: 400 })
    }

    if (!cursoId) {
      return NextResponse.json({ 
        error: 'Se requiere el parámetro cursoId' 
      }, { status: 400 })
    }

    // Obtener información del curso
    const infoCurso = await obtenerInfoCurso(cursoId)
    
    if (!infoCurso) {
      return NextResponse.json({ 
        error: 'Curso no encontrado' 
      }, { status: 404 })
    }

    // Validar múltiples fechas si se proporciona el parámetro fechas
    if (fechas) {
      const listaFechas = fechas.split(',').map(f => f.trim())
      const validaciones = await validarMultiplesFechas(listaFechas, cursoId)
      
      const resultado: Record<string, any> = {}
      validaciones.forEach((validacion, fecha) => {
        resultado[fecha] = validacion
      })

      return NextResponse.json({
        curso: infoCurso,
        validaciones: resultado
      })
    }

    // Validar fecha única
    if (fecha) {
      const validacion = await validarDiaBloqueado(fecha, cursoId)

      return NextResponse.json({
        fecha,
        curso: infoCurso,
        ...validacion
      })
    }

  } catch (err: any) {
    console.error('[api/dias-bloqueados/validar] Unexpected error:', err)
    return NextResponse.json({ 
      error: err.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}