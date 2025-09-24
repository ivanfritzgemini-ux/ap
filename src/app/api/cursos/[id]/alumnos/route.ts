import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: { id?: string } }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        estudiante_id,
        nro_registro,
        fecha_retiro,
        es_matricula_actual,
        usuarios!estudiante_id (
          rut,
          nombres,
          apellidos,
          email
        )
      `)
      .eq('curso_id', id)
      // Mostrar todos los estudiantes que han estado en este curso (activos y retirados)
      .order('nro_registro', { ascending: true });

    if (error) {
      console.error('Error fetching students for course:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const students = data.map(student => {
      const usuario = Array.isArray(student.usuarios) ? student.usuarios[0] : student.usuarios;
      return {
        id: student.estudiante_id, // Usar el ID del usuario
        registration_number: student.nro_registro,
        rut: usuario?.rut ?? 'N/A',
        name: `${usuario?.nombres ?? ''} ${usuario?.apellidos ?? ''}`.trim(),
        email: usuario?.email ?? 'N/A',
        fecha_retiro: student.fecha_retiro,
        es_matricula_actual: student.es_matricula_actual,
      }
    })

    return NextResponse.json({ data: students })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
