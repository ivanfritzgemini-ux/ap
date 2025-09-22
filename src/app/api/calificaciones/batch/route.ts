import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { calificaciones } = await request.json()
    
    if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
      return NextResponse.json({ error: 'calificaciones array is required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Procesar cada calificación
    const results = []
    const errors = []
    
    for (const calificacion of calificaciones) {
      try {
        const {
          periodo_id,
          curso_id,
          asignatura_id,
          estudiante_id,
          notas,
          promedio
        } = calificacion

        // Validar datos requeridos
        if (!periodo_id || !curso_id || !asignatura_id || !estudiante_id) {
          errors.push({
            estudiante_id,
            error: 'Missing required fields: periodo_id, curso_id, asignatura_id, estudiante_id'
          })
          continue
        }

        // Primero necesitamos obtener el curso_asignatura_id
        const { data: cursoAsignatura, error: caError } = await supabase
          .from('curso_asignatura')
          .select('id')
          .eq('curso_id', curso_id)
          .eq('asignatura_id', asignatura_id)
          .single()

        if (caError) {
          errors.push({
            estudiante_id,
            error: `No se encontró relación curso-asignatura: ${caError.message}`
          })
          continue
        }

        const curso_asignatura_id = cursoAsignatura.id

        // Verificar si ya existe una calificación para este contexto
        const { data: existing, error: checkError } = await supabase
          .from('calificaciones')
          .select('id')
          .eq('periodo_academico_id', periodo_id)
          .eq('curso_asignatura_id', curso_asignatura_id)
          .eq('estudiante_id', estudiante_id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          errors.push({
            estudiante_id,
            error: checkError.message
          })
          continue
        }

        const calificacionData = {
          periodo_academico_id: periodo_id,
          curso_asignatura_id,
          estudiante_id,
          notas: notas, // Guardar como objeto JSON
          promedio,
          actualizado_en: new Date().toISOString()
        }

        let result
        if (existing) {
          // Actualizar calificación existente
          const { data, error } = await supabase
            .from('calificaciones')
            .update(calificacionData)
            .eq('id', existing.id)
            .select()
            .single()

          if (error) {
            errors.push({
              estudiante_id,
              error: error.message
            })
            continue
          }
          result = { action: 'updated', data }
        } else {
          // Crear nueva calificación
          const { data, error } = await supabase
            .from('calificaciones')
            .insert({
              ...calificacionData,
              creado_en: new Date().toISOString()
            })
            .select()
            .single()

          if (error) {
            errors.push({
              estudiante_id,
              error: error.message
            })
            continue
          }
          result = { action: 'created', data }
        }

        results.push({
          estudiante_id,
          ...result
        })

      } catch (err: any) {
        errors.push({
          estudiante_id: calificacion.estudiante_id || 'unknown',
          error: err.message
        })
      }
    }

    const response = {
      success: results.length,
      errorCount: errors.length,
      results,
      errors
    }

    const statusCode = errors.length > 0 ? (results.length > 0 ? 207 : 400) : 200
    
    return NextResponse.json(response, { status: statusCode })

  } catch (err: any) {
    console.error('Error in batch calificaciones:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}