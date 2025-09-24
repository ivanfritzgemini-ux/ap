import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET - Obtener niveles y letras disponibles en la tabla cursos
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const url = new URL(request.url)
    const nivel = url.searchParams.get('nivel') // Para obtener letras de un nivel específico

    if (nivel) {
      // Obtener letras disponibles para un nivel específico
      const { data: cursosData, error } = await supabase
        .from('cursos')
        .select('letra')
        .eq('nivel', nivel)
        .not('letra', 'is', null)
        .order('letra', { ascending: true })

      if (error) {
        console.error('[api/cursos/estructura] Error fetching letras:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Extraer letras únicas
      const letras = [...new Set(cursosData?.map(c => c.letra).filter(Boolean) || [])]
      
      const letrasOptions = [
        { value: 'todas', label: 'Todas las letras' },
        ...letras.map(letra => ({ 
          value: letra, 
          label: letra 
        }))
      ]

      return NextResponse.json({ 
        data: {
          nivel,
          letras: letrasOptions
        }
      })
    } else {
      // Obtener estructura completa: niveles con sus letras
      const { data: cursosData, error } = await supabase
        .from('cursos')
        .select('nivel, letra')
        .not('nivel', 'is', null)
        .order('nivel', { ascending: true })

      if (error) {
        console.error('[api/cursos/estructura] Error fetching estructura:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Procesar datos para obtener estructura de niveles y letras
      const estructuraPorNivel = new Map<string, Set<string>>()
      
      cursosData?.forEach(curso => {
        if (curso.nivel) {
          if (!estructuraPorNivel.has(curso.nivel)) {
            estructuraPorNivel.set(curso.nivel, new Set())
          }
          if (curso.letra) {
            estructuraPorNivel.get(curso.nivel)!.add(curso.letra)
          }
        }
      })

      // Convertir a formato de opciones
      const nivelesDisponibles = Array.from(estructuraPorNivel.keys()).sort((a, b) => parseInt(a) - parseInt(b))
      
      // Crear opciones de niveles
      const nivelesOptions = [
        { value: 'todos', label: 'Todos los niveles' }
      ]

      // Agregar opciones agrupadas
      if (nivelesDisponibles.length > 1) {
        nivelesOptions.push(
          { value: 'todos-primeros', label: 'Todos los 1° Medio' },
          { value: 'todos-segundos', label: 'Todos los 2° Medio' },
          { value: 'todos-terceros', label: 'Todos los 3° Medio' },
          { value: 'todos-cuartos', label: 'Todos los 4° Medio' }
        )
      }

      // Agregar niveles específicos
      nivelesOptions.push(
        ...nivelesDisponibles.map(nivel => ({
          value: nivel,
          label: `${nivel}° Medio`
        }))
      )

      // Crear mapa de letras por nivel
      const letrasPorNivel: Record<string, Array<{value: string, label: string}>> = {}
      
      estructuraPorNivel.forEach((letras, nivel) => {
        const letrasArray = Array.from(letras).sort()
        letrasPorNivel[nivel] = [
          { value: 'todas', label: 'Todas las letras' },
          ...letrasArray.map(letra => ({
            value: letra,
            label: letra
          }))
        ]
      })

      // Crear lista única de todas las letras disponibles
      const todasLasLetras = new Set<string>()
      estructuraPorNivel.forEach(letras => {
        letras.forEach(letra => todasLasLetras.add(letra))
      })

      const todasLetrasOptions = [
        { value: 'todas', label: 'Todas las letras' },
        ...Array.from(todasLasLetras).sort().map(letra => ({
          value: letra,
          label: letra
        }))
      ]

      return NextResponse.json({
        data: {
          niveles: nivelesOptions,
          letrasPorNivel,
          todasLasLetras: todasLetrasOptions,
          estructura: Object.fromEntries(
            Array.from(estructuraPorNivel.entries()).map(([nivel, letras]) => [
              nivel, 
              Array.from(letras).sort()
            ])
          )
        }
      })
    }

  } catch (err: any) {
    console.error('[api/cursos/estructura] Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}