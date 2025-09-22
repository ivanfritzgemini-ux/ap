import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST /api/calificaciones/batch received:', JSON.stringify(body, null, 2))
    
    const { calificaciones } = body
    
    if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
      console.error('Invalid calificaciones array:', calificaciones)
      return NextResponse.json({ error: 'calificaciones array is required' }, { status: 400 })
    }

    console.log('Processing', calificaciones.length, 'calificaciones')
    const supabase = await createServerClient()
    
    // Procesar cada calificación
    const results = []
    const errors = []
    
    for (const calificacion of calificaciones) {
      try {
        console.log('Processing calificacion:', calificacion)
        
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
          const error = 'Missing required fields: periodo_id, curso_id, asignatura_id, estudiante_id'
          console.error(error, { periodo_id, curso_id, asignatura_id, estudiante_id })
          errors.push({
            estudiante_id,
            error
          })
          continue
        }

        console.log('Looking for curso_asignatura:', { curso_id, asignatura_id })
        // Primero necesitamos obtener el curso_asignatura_id
        const { data: cursoAsignatura, error: caError } = await supabase
          .from('curso_asignatura')
          .select('id')
          .eq('curso_id', curso_id)
          .eq('asignatura_id', asignatura_id)
          .single()

        if (caError) {
          console.error('curso_asignatura lookup error:', caError)
          errors.push({
            estudiante_id,
            error: `No se encontró relación curso-asignatura: ${caError.message}`
          })
          continue
        }

        console.log('Found curso_asignatura:', cursoAsignatura)
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

        // Convertir notas de objeto a arreglo para PostgreSQL
        console.log('Original notas:', notas)
        const notasArray = [
          notas.nota1,
          notas.nota2,
          notas.nota3,
          notas.nota4,
          notas.nota5,
          notas.nota6,
          notas.nota7,
          notas.nota8,
          notas.nota9,
          notas.nota10
        ].filter(nota => nota !== null && nota !== undefined) // Solo incluir notas válidas

        console.log('Converted notasArray:', notasArray)

        // Calculate average manually to avoid trigger issues
        const promedioCalculado = notasArray.length > 0 
          ? Number((notasArray.reduce((sum, nota) => sum + nota, 0) / notasArray.length).toFixed(1))
          : null

        const calificacionData = {
          periodo_academico_id: periodo_id,
          curso_asignatura_id,
          estudiante_id,
          notas: [], // Start with empty array to avoid trigger issues
          actualizado_en: new Date().toISOString()
        }

        console.log('Final calificacionData:', calificacionData)

        let result
        if (existing) {
          // Actualizar calificación existente - primero limpiar notas
          const { data, error } = await supabase
            .from('calificaciones')
            .update({
              ...calificacionData,
              notas: [] // Clear first
            })
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

          // Luego actualizar las notas y promedio si tenemos datos
          if (notasArray.length > 0) {
            const updateResult = await supabase
              .from('calificaciones')
              .update({ 
                notas: notasArray,
                promedio: promedioCalculado 
              })
              .eq('id', existing.id)
              .select()
              .single()

            if (updateResult.error) {
              errors.push({
                estudiante_id,
                error: updateResult.error.message
              })
              continue
            }
          }

          result = { action: 'updated', data }
        } else {
          // Crear nueva calificación - primero sin notas
          const { data, error } = await supabase
            .from('calificaciones')
            .insert({
              ...calificacionData,
              notas: [], // Start empty
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

          // Luego actualizar las notas y promedio si tenemos datos
          if (notasArray.length > 0 && data) {
            const updateResult = await supabase
              .from('calificaciones')
              .update({ 
                notas: notasArray,
                promedio: promedioCalculado 
              })
              .eq('id', data.id)
              .select()
              .single()

            if (updateResult.error) {
              errors.push({
                estudiante_id,
                error: updateResult.error.message
              })
              continue
            }
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

    console.log('Final response:', response)
    const statusCode = errors.length > 0 ? (results.length > 0 ? 207 : 400) : 200
    
    return NextResponse.json(response, { status: statusCode })

  } catch (err: any) {
    console.error('Error in batch calificaciones:', err)
    return NextResponse.json({ 
      error: err.message || 'Unknown error',
      stack: err.stack 
    }, { status: 500 })
  }
}