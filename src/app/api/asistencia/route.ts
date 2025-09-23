import { NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET - Obtener registros de asistencia
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursoId = searchParams.get('cursoId')
    const fecha = searchParams.get('fecha')
    const mes = searchParams.get('mes')
    const año = searchParams.get('año')
    
    if (!cursoId) {
      return NextResponse.json({ error: 'cursoId is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    
    let query = supabase
      .from('asistencia')
      .select(`
        id,
        estudiante_id,
        curso_id,
        fecha,
        presente,
        justificado,
        tipo_ausencia,
        observaciones,
        created_at,
        updated_at
      `)
      .eq('curso_id', cursoId)

    // Filtrar por fecha específica
    if (fecha) {
      query = query.eq('fecha', fecha)
    }
    
    // Filtrar por mes y año
    if (mes && año) {
      const mesNumero = parseInt(mes, 10);
      const añoNumero = parseInt(año, 10);

      // Calcular el último día del mes correctamente
      const ultimoDiaDelMes = new Date(añoNumero, mesNumero, 0).getDate();
      
      const startDate = `${año}-${mes.padStart(2, '0')}-01`;
      const endDate = `${año}-${mes.padStart(2, '0')}-${ultimoDiaDelMes.toString().padStart(2, '0')}`;
      
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    }

    const { data, error } = await query.order('fecha', { ascending: true })

    if (error) {
      console.error('Error fetching asistencia:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('Error in GET /api/asistencia:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST - Crear o actualizar registros de asistencia
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { registros } = body // Array de registros de asistencia

    if (!registros || !Array.isArray(registros)) {
      return NextResponse.json({ error: 'registros array is required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    
    // Procesar cada registro
    const results = []
    const errors = []

    for (const registro of registros) {
      try {
        const { estudiante_id, curso_id, fecha, presente, justificado, tipo_ausencia, observaciones } = registro

        if (!estudiante_id || !curso_id || !fecha) {
          errors.push({
            registro,
            error: 'estudiante_id, curso_id y fecha are required'
          })
          continue
        }

        // Verificar si ya existe un registro para este estudiante en esta fecha
        const { data: existing, error: checkError } = await supabase
          .from('asistencia')
          .select('id')
          .eq('estudiante_id', estudiante_id)
          .eq('fecha', fecha)
          .maybeSingle()

        if (checkError) {
          errors.push({
            registro,
            error: checkError.message
          })
          continue
        }

        let result
        if (existing) {
          // Actualizar registro existente
          const { data, error } = await supabase
            .from('asistencia')
            .update({
              presente: presente ?? false,
              justificado: justificado ?? false,
              tipo_ausencia: tipo_ausencia || 'injustificada',
              observaciones,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) {
            errors.push({
              registro,
              error: error.message
            })
            continue
          }

          result = { ...data, action: 'updated' }
        } else {
          // Crear nuevo registro
          const { data, error } = await supabase
            .from('asistencia')
            .insert({
              estudiante_id,
              curso_id,
              fecha,
              presente: presente ?? false,
              justificado: justificado ?? false,
              tipo_ausencia: tipo_ausencia || 'injustificada',
              observaciones
            })
            .select()
            .single()

          if (error) {
            errors.push({
              registro,
              error: error.message
            })
            continue
          }

          result = { ...data, action: 'created' }
        }

        results.push(result)
      } catch (err: any) {
        errors.push({
          registro,
          error: err.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      total: registros.length,
      processed: results.length,
      failed: errors.length
    })

  } catch (err: any) {
    console.error('Error in POST /api/asistencia:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}