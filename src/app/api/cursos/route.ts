import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // 1) Fetch cursos including tipo_educacion and profesor_jefe -> usuarios (nombres, apellidos)
    const { data: cursosData, error: cursosErr } = await supabase
      .from('cursos')
      .select(`
        id,
        nivel,
        letra,
        tipo_educacion:tipo_educacion_id(nombre),
        profesor_jefe:profesor_jefe_id(usuarios ( id, nombres, apellidos ))
      `)
      .order('nivel', { ascending: true })

    if (cursosErr) {
      console.error('[api/cursos] supabase error fetching cursos:', cursosErr)
      return NextResponse.json({ error: cursosErr.message }, { status: 500 })
    }

    const cursos = Array.isArray(cursosData) ? cursosData : []

    // 2) Fetch student counts grouped by curso_id (only active students: es_matricula_actual = true)
    const { data: studentsRows, error: studentsErr } = await supabase
      .from('estudiantes_detalles')
      .select('curso_id', { count: 'exact', head: false })
      .eq('es_matricula_actual', true)

    if (studentsErr) {
      console.error('[api/cursos] supabase error fetching estudiantes_detalles counts:', studentsErr)
      // continue with zero counts if counting fails
    }

    // Build a simple map of counts by curso_id
    const countsMap: Record<string, number> = {}
    if (Array.isArray(studentsRows)) {
      for (const row of studentsRows as any[]) {
        const key = String(row.curso_id)
        countsMap[key] = (countsMap[key] || 0) + 1
      }
    }

    // 3) Normalize and return desired shape
    const normalized = cursos.map((c: any) => {
      const id = c.id
      const nivel = c.nivel ?? ''
      const letra = c.letra ?? ''
      const nombre_curso = [nivel, letra].filter(Boolean).join(' ').trim()

      // tipo_educacion may come as array or object
      const tipo = Array.isArray(c.tipo_educacion) ? c.tipo_educacion[0]?.nombre : c.tipo_educacion?.nombre

      // profesor_jefe relation may be array or object; its usuarios subrelation contains names
      let profesorJefeName: string | null = null
      try {
        const profRel = c.profesor_jefe
        // If profRel is array, take first, which contains usuarios relation
        const prof = Array.isArray(profRel) ? profRel[0] : profRel
        const usuario = prof?.usuarios ? (Array.isArray(prof.usuarios) ? prof.usuarios[0] : prof.usuarios) : null
        const nombres = usuario?.nombres ?? ''
        const apellidos = usuario?.apellidos ?? ''
        profesorJefeName = [nombres, apellidos].filter(Boolean).join(' ') || null
      } catch (e) {
        profesorJefeName = null
      }

      const alumnos = countsMap[String(id)] ?? 0

      return {
        id,
        nombre_curso,
        tipo_ensenanza: tipo ?? null,
        profesor_jefe: profesorJefeName,
        alumnos,
        // include raw curso data for debugging if needed
        _raw: c,
      }
    })

    return NextResponse.json({ data: normalized })
  } catch (err: any) {
    console.error('[api/cursos] unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
