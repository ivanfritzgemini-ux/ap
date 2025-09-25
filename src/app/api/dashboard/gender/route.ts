import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Obtener todos los estudiantes con matrícula actual y su información de sexo
    const { data: estudiantesData, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select(`
        estudiante_id,
        usuarios!inner(
          id,
          sexo_id
        )
      `)
      .eq('es_matricula_actual', true)

    if (estudiantesError) {
      console.error('Error en consulta de estudiantes:', estudiantesError)
      return NextResponse.json({ error: 'Error al obtener datos de estudiantes' }, { status: 500 })
    }

    // Contar por género usando los IDs específicos
    let women = 0
    let men = 0

    if (estudiantesData) {
      for (const estudiante of estudiantesData) {
        // usuarios es un array, tomar el primer elemento
        const usuario = Array.isArray(estudiante.usuarios) ? estudiante.usuarios[0] : estudiante.usuarios
        const sexoId = usuario?.sexo_id
        if (sexoId === 'a96401ae-e227-4a1d-9978-d87faa1bb2c2') {
          women++
        } else if (sexoId === 'c871e0f9-ec4e-4039-9287-027340665d1c') {
          men++
        }
      }
    }

    return NextResponse.json({ women, men })
  } catch (err: any) {
    console.error('Error general:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
