import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - Obtener cursos disponibles para selector de días bloqueados
export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: cursosData, error } = await supabase
      .from('cursos')
      .select('id, nivel, letra')
      .order('nivel', { ascending: true })
      .order('letra', { ascending: true })

    if (error) {
      console.error('[api/dias-bloqueados/cursos] Error fetching cursos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Procesar cursos para el selector
    const cursos = cursosData?.map(curso => ({
      id: curso.id,
      nivel: curso.nivel,
      letra: curso.letra,
      label: `${curso.nivel}° Medio ${curso.letra}`,
      value: curso.id
    })) || []

    // Agregar opciones especiales
    const opciones = [
      { 
        id: null, 
        nivel: null, 
        letra: null, 
        label: 'Todos los cursos', 
        value: 'todos' 
      },
      ...cursos
    ]

    // Agrupar por nivel para opciones adicionales
    const nivelesUnicos = [...new Set(cursosData?.map(c => c.nivel).filter(Boolean) || [])]
    const opcionesNivel = nivelesUnicos.map(nivel => ({
      id: null,
      nivel,
      letra: null,
      label: `Todos los ${nivel}° Medio`,
      value: `nivel-${nivel}`
    }))

    // Insertar opciones de nivel después de "Todos los cursos"
    opciones.splice(1, 0, ...opcionesNivel)

    return NextResponse.json({ 
      data: {
        opciones,
        cursos: cursosData || []
      }
    })
  } catch (err: any) {
    console.error('[api/dias-bloqueados/cursos] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}