import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Esquema de validación para días bloqueados (estructura real de la tabla)
const diaBloqueadoSchema = z.object({
  id: z.string().optional(),
  curso_id: z.string().nullable(), // ID del curso específico, null para todos
  fecha: z.string().refine(v => !Number.isNaN(Date.parse(v)), { message: 'Fecha inválida' }),
  resolucion: z.string().min(1, 'La resolución es obligatoria'),
  motivo: z.string().min(1, 'El motivo es obligatorio'),
})

// GET - Obtener todos los días bloqueados con información del curso
export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('dias_bloqueados')
      .select(`
        *,
        curso:curso_id(
          id,
          nivel,
          letra
        )
      `)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('[api/dias-bloqueados] Error fetching:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    console.error('[api/dias-bloqueados] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// POST - Crear nuevo día bloqueado o realizar acciones específicas
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    // Verificar si es una acción especial
    if (body.action === 'get_details') {
      // Obtener detalles de días bloqueados para fechas específicas
      const { curso_id, fechas } = body
      
      if (!curso_id || !Array.isArray(fechas)) {
        return NextResponse.json({ error: 'curso_id y fechas son requeridos' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('dias_bloqueados')
        .select('fecha, motivo, resolucion')
        .eq('curso_id', curso_id)
        .in('fecha', fechas)

      if (error) {
        console.error('[api/dias-bloqueados] Error fetching details:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Organizar los datos por fecha
      const detalles: Record<string, {motivos: string[], resoluciones: string[]}> = {}
      data?.forEach(item => {
        if (!detalles[item.fecha]) {
          detalles[item.fecha] = {
            motivos: [],
            resoluciones: []
          }
        }
        detalles[item.fecha].motivos.push(item.motivo)
        detalles[item.fecha].resoluciones.push(item.resolucion)
      })

      return NextResponse.json({ detalles })
    }

    // Crear nuevo día bloqueado (comportamiento original)
    const parsed = diaBloqueadoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: parsed.error.errors 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dias_bloqueados')
      .insert([parsed.data])
      .select(`
        *,
        curso:curso_id(
          id,
          nivel,
          letra
        )
      `)
      .single()

    if (error) {
      console.error('[api/dias-bloqueados] Error creating:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/dias-bloqueados] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// PUT - Actualizar día bloqueado
export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 })
    }

    const parsed = diaBloqueadoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: parsed.error.errors 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dias_bloqueados')
      .update(parsed.data)
      .eq('id', body.id)
      .select(`
        *,
        curso:curso_id(
          id,
          nivel,
          letra
        )
      `)
      .single()

    if (error) {
      console.error('[api/dias-bloqueados] Error updating:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/dias-bloqueados] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// DELETE - Eliminar día bloqueado
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('dias_bloqueados')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[api/dias-bloqueados] Error deleting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[api/dias-bloqueados] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}