import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: { id?: string } }) {
		try {
			const { id } = (await params) as { id?: string }
			if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

		const supabase = await createServerClient()

			const { data: cursosData, error: cursosErr } = await supabase
				.from('cursos')
				.select(`
					id,
					nivel,
					letra,
					tipo_educacion:tipo_educacion_id(id, nombre),
					profesor_jefe:profesor_jefe_id(id, usuarios ( id, nombres, apellidos ))
				`)
			.eq('id', id)
			.limit(1)
			.single()

		if (cursosErr) {
			console.error('[api/cursos/[id]] supabase error fetching curso:', cursosErr)
			return NextResponse.json({ error: cursosErr.message }, { status: 500 })
		}

		if (!cursosData) {
			return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
		}

		const c = cursosData as any
		const nombre_curso = [c.nivel ?? '', c.letra ?? ''].filter(Boolean).join(' ').trim()
		const tipo = Array.isArray(c.tipo_educacion) ? c.tipo_educacion[0]?.nombre : c.tipo_educacion?.nombre

			let profesorJefeName: string | null = null
			try {
				const profRel = c.profesor_jefe
				const prof = Array.isArray(profRel) ? profRel[0] : profRel
				const usuario = prof?.usuarios ? (Array.isArray(prof.usuarios) ? prof.usuarios[0] : prof.usuarios) : null
				const nombres = usuario?.nombres ?? ''
				const apellidos = usuario?.apellidos ?? ''
				profesorJefeName = [nombres, apellidos].filter(Boolean).join(' ') || null
			} catch (e) {
				profesorJefeName = null
			}

		// Count active students for this curso
		let alumnos = 0
		try {
			const { data: studentsRows } = await supabase
				.from('estudiantes_detalles')
				.select('curso_id')
				.eq('curso_id', id)
				.is('fecha_retiro', null)

			if (Array.isArray(studentsRows)) alumnos = studentsRows.length
		} catch (e) {
			// ignore errors counting students
		}

		const normalized = {
			id: c.id,
			nombre_curso,
			nivel: c.nivel ?? null,
			letra: c.letra ?? null,
			tipo_ensenanza: tipo ?? null,
			tipo_educacion_id: Array.isArray(c.tipo_educacion) ? String(c.tipo_educacion[0]?.id ?? '') : String(c.tipo_educacion?.id ?? ''),
			profesor_jefe: profesorJefeName,
			// profesor_jefe comes from profesores_detalles via profesor_jefe_id; here we expose the profesores_detalles.id so the client can match teacher_details.id
			profesor_jefe_id: Array.isArray(c.profesor_jefe) ? String(c.profesor_jefe[0]?.id ?? '') : (c.profesor_jefe?.id ? String(c.profesor_jefe.id) : null),
			alumnos,
			_raw: c,
		}

		return NextResponse.json({ data: normalized })
	} catch (err: any) {
		console.error('[api/cursos/[id]] unexpected error:', err)
		return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
	}
}

export async function PUT(req: Request, { params }: { params: { id?: string } }) {
	try {
		const { id } = (await params) as { id?: string }
		if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

		const body = await req.json()
		const { nivel, letra, nombre, tipo_educacion_id, profesor_jefe_id } = body || {}

		const supabase = await createServerClient()

		const payload: any = {}
		if (nivel !== undefined) payload.nivel = nivel
		if (letra !== undefined) payload.letra = letra
		if (nombre !== undefined) payload.nombre_curso = nombre
		if (tipo_educacion_id !== undefined) payload.tipo_educacion_id = tipo_educacion_id
		if (profesor_jefe_id !== undefined) payload.profesor_jefe_id = profesor_jefe_id

		const { data, error } = await supabase.from('cursos').update(payload).eq('id', id).select().single()
		if (error) {
			console.error('[api/cursos/[id]] supabase error updating curso:', error)
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		if (!data) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

		return NextResponse.json({ data })
	} catch (err: any) {
		console.error('[api/cursos/[id]] unexpected error:', err)
		return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
	}
}

export async function DELETE(req: Request, { params }: { params: { id?: string } }) {
	try {
		const { id } = (await params) as { id?: string }
		if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

		const supabase = await createServerClient()

		// Count active students linked to this curso (fecha_retiro IS NULL)
		const { data: studentsRows, error: studentsErr } = await supabase
			.from('estudiantes_detalles')
			.select('id')
			.eq('curso_id', id)
			.is('fecha_retiro', null)

		if (studentsErr) {
			console.error('[api/cursos/[id] DELETE] error counting students:', studentsErr)
			return NextResponse.json({ error: 'Error comprobando alumnos' }, { status: 500 })
		}

		const activeCount = Array.isArray(studentsRows) ? studentsRows.length : 0
		if (activeCount > 0) {
			return NextResponse.json({ error: 'No se puede eliminar un curso que tiene alumnos activos.' }, { status: 400 })
		}

		// Safe to delete
		const { data, error } = await supabase.from('cursos').delete().eq('id', id).select().single()
		if (error) {
			console.error('[api/cursos/[id] DELETE] supabase error deleting curso:', error)
			return NextResponse.json({ error: error.message || 'Error eliminando curso' }, { status: 500 })
		}

		return NextResponse.json({ data })
	} catch (err: any) {
		console.error('[api/cursos/[id] DELETE] unexpected error:', err)
		return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
	}
}
