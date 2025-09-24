import { createServerClient } from '@/lib/supabase/server'

export interface DiaBloqueado {
  id: string
  curso_id?: string | null
  fecha: string
  resolucion: string
  motivo: string
  created_at: string
}

export interface ValidacionBloqueo {
  bloqueado: boolean
  motivos: string[]
  resoluciones: string[]
}

/**
 * Valida si un día específico está bloqueado para un curso determinado
 * @param fecha - Fecha a validar (formato YYYY-MM-DD)
 * @param cursoId - ID del curso a validar
 * @returns Objeto con información del bloqueo
 */
export async function validarDiaBloqueado(
  fecha: string,
  cursoId?: string
): Promise<ValidacionBloqueo> {
  try {
    const supabase = await createServerClient()

    // Obtener todos los bloqueos para la fecha específica
    const { data: bloqueos, error } = await supabase
      .from('dias_bloqueados')
      .select('*')
      .eq('fecha', fecha)

    if (error || !bloqueos || bloqueos.length === 0) {
      return {
        bloqueado: false,
        motivos: [],
        resoluciones: []
      }
    }

    const motivos: string[] = []
    const resoluciones: string[] = []

    // Verificar cada bloqueo
    for (const bloqueo of bloqueos) {
      let aplicaBloqueo = false

      // Si curso_id es null, el bloqueo aplica a todos los cursos
      if (!bloqueo.curso_id) {
        aplicaBloqueo = true
      } 
      // Si hay curso_id específico, verificar coincidencia
      else if (cursoId && bloqueo.curso_id === cursoId) {
        aplicaBloqueo = true
      }

      if (aplicaBloqueo) {
        motivos.push(bloqueo.motivo)
        resoluciones.push(bloqueo.resolucion)
      }
    }

    return {
      bloqueado: motivos.length > 0,
      motivos: [...new Set(motivos)], // Remover duplicados
      resoluciones: [...new Set(resoluciones)] // Remover duplicados
    }
  } catch (error) {
    console.error('Error validating blocked day:', error)
    return {
      bloqueado: false,
      motivos: [],
      resoluciones: []
    }
  }
}

/**
 * Obtiene información del curso por su ID
 * @param cursoId - ID del curso
 * @returns Información del curso
 */
export async function obtenerInfoCurso(cursoId: string) {
  try {
    const supabase = await createServerClient()

    const { data: curso, error } = await supabase
      .from('cursos')
      .select('id, nivel, letra')
      .eq('id', cursoId)
      .single()

    if (error || !curso) {
      return null
    }

    return {
      id: curso.id,
      nivel: curso.nivel,
      letra: curso.letra
    }
  } catch (error) {
    console.error('Error fetching curso info:', error)
    return null
  }
}

/**
 * Valida múltiples fechas para un curso específico
 * @param fechas - Array de fechas a validar
 * @param cursoId - ID del curso
 * @returns Map con las validaciones por fecha
 */
export async function validarMultiplesFechas(
  fechas: string[],
  cursoId: string
): Promise<Map<string, ValidacionBloqueo>> {
  const resultado = new Map<string, ValidacionBloqueo>()
  
  // Obtener información del curso
  const infoCurso = await obtenerInfoCurso(cursoId)
  
  if (!infoCurso) {
    // Si no se puede obtener info del curso, marcar todas como no bloqueadas
    fechas.forEach(fecha => {
      resultado.set(fecha, {
        bloqueado: false,
        motivos: [],
        resoluciones: []
      })
    })
    return resultado
  }

  // Validar cada fecha
  for (const fecha of fechas) {
    const validacion = await validarDiaBloqueado(fecha, cursoId)
    resultado.set(fecha, validacion)
  }

  return resultado
}

/**
 * Obtiene todos los días bloqueados activos para un rango de fechas
 * @param fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns Array de días bloqueados
 */
export async function obtenerDiasBloqueadosEnRango(
  fechaInicio: string,
  fechaFin: string
): Promise<DiaBloqueado[]> {
  try {
    const supabase = await createServerClient()

    const { data: bloqueos, error } = await supabase
      .from('dias_bloqueados')
      .select('*')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

    if (error) {
      console.error('Error fetching blocked days in range:', error)
      return []
    }

    return bloqueos || []
  } catch (error) {
    console.error('Error fetching blocked days in range:', error)
    return []
  }
}