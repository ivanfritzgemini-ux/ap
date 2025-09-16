import type { User, Student } from './types';
import { createServerClient } from '@/app/lib/supabase/server';

export async function fetchUsers(): Promise<User[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id,
      rut,
      nombres,
      apellidos,
      email,
      sexo:sexo_id(nombre),
      rol:rol_id(nombre_rol)
    `);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data.map((user) => ({
    id: user.id,
    name: `${user.apellidos || ''} ${user.nombres || ''}`.trim(),
    email: user.email,
    rut: user.rut,
    // @ts-ignore
    gender: user.sexo?.nombre,
    // @ts-ignore
    role: user.rol?.nombre_rol,
  }));
}

export async function getStudents(): Promise<Student[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('estudiantes_detalles')
    .select(`
      id,
      fecha_retiro,
      motivo_retiro,
      nro_registro,
      fecha_matricula,
      usuarios (
        rut,
        nombres,
        apellidos,
        email,
        sexo:sexo_id(nombre)
      ),
      cursos:curso_id (
        nivel,
        letra,
        tipo_educacion:tipo_educacion_id(nombre)
      )
    `)
    .order('nro_registro', { ascending: true })
    ;


  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data.map((student) => {
    // related fields may be returned as arrays (due to PostgREST relation handling)
    const usuariosRel = Array.isArray(student.usuarios) ? student.usuarios[0] : student.usuarios;
    const cursosRel = Array.isArray(student.cursos) ? student.cursos[0] : student.cursos;

    // tipo_educacion may be an array; normalize to string
    const tipoObj = Array.isArray(cursosRel?.tipo_educacion) ? cursosRel.tipo_educacion[0] : cursosRel?.tipo_educacion
    const tipoEducacion = tipoObj?.nombre ?? '';
    let nombreAbreviado = tipoEducacion;
    if (typeof tipoEducacion === 'string' && tipoEducacion.includes('Media')) {
      nombreAbreviado = 'Medio';
    }

    return {
      id: student.id,
      // include retiro fields if present
      fecha_retiro: student.fecha_retiro ?? undefined,
      motivo_retiro: student.motivo_retiro ?? undefined,
      registration_number: student.nro_registro,
      rut: usuariosRel?.rut ?? 'N/A',
      nombres: usuariosRel?.nombres ?? 'N/A',
      apellidos: usuariosRel?.apellidos ?? 'N/A',
      email: usuariosRel?.email ?? 'N/A',
  // sexo relation may be an array as well
  // @ts-ignore - dynamic relation shape from Supabase
  sexo: (Array.isArray(usuariosRel?.sexo) ? usuariosRel.sexo[0]?.nombre : usuariosRel?.sexo?.nombre) ?? 'N/A',
      curso: cursosRel ? `${cursosRel.nivel}º ${nombreAbreviado} ${cursosRel.letra}` : 'Sin curso',
      enrollment_date: student.fecha_matricula,
    };
  });
}

export async function getCourseDetails(id: string) {
  const supabase = await createServerClient();
  const { data: cursosData, error: cursosErr } = await supabase
    .from('cursos')
    .select(`
      id,
      nivel,
      letra,
      profesor_jefe:profesor_jefe_id(id, usuarios ( id, nombres, apellidos ))
    `)
    .eq('id', id)
    .single();

  if (cursosErr) {
    console.error('Error fetching course details:', cursosErr);
    return null;
  }

  const c = cursosData as any;
  const nombre_curso = [c.nivel ?? '', c.letra ?? ''].filter(Boolean).join(' ').trim();

  let profesorJefeName: string | null = null;
  // Safer data access
  if (c.profesor_jefe) {
    const profRel = Array.isArray(c.profesor_jefe) ? c.profesor_jefe[0] : c.profesor_jefe;
    if (profRel && profRel.usuarios) {
        const usuario = Array.isArray(profRel.usuarios) ? profRel.usuarios[0] : profRel.usuarios;
        if (usuario) {
            profesorJefeName = `${usuario.apellidos ?? ''} ${usuario.nombres ?? ''}`.trim() || null;
        }
    }
  }

  return {
    id: c.id,
    nombre_curso,
    profesor_jefe: profesorJefeName,
  };
}

export async function getStudentsByCourse(courseId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('estudiantes_detalles')
    .select(`
      id,
      nro_registro,
      fecha_matricula,
      fecha_retiro,
      usuarios (
        nombres,
        apellidos
      )
    `)
    .eq('curso_id', courseId)
    // Try to order at the DB level by related user fields, then by enrollment date.
    // Note: ordering on related tables may depend on PostgREST/Supabase behavior; we also apply
    // a JS-side stable sort below as a fallback to ensure the required composite ordering.
    .order('apellidos', { foreignTable: 'usuarios', ascending: true })
    .order('nombres', { foreignTable: 'usuarios', ascending: true })
    .order('fecha_matricula', { ascending: true });

  if (error) {
    console.error('Error fetching students for course:', error);
    return [];
  }

  // Normalize and map results, but first apply a JS-side stable sort to guarantee ordering by:
  // 1) apellido asc, 2) nombres asc, 3) fecha_matricula asc. We intentionally do not filter out
  // withdrawn students here (no distinction between retirados/matriculados) as requested.
  const normalized = (data as any[]).map(student => {
    const usuario = Array.isArray(student.usuarios) ? student.usuarios[0] : student.usuarios;
    return {
      raw: student,
      id: student.id,
      registration_number: student.nro_registro,
      enrollment_date: student.fecha_matricula,
      withdrawal_date: student.fecha_retiro,
      apellido: (usuario?.apellidos ?? '').toString(),
      nombres: (usuario?.nombres ?? '').toString(),
      name: `${usuario?.apellidos ?? ''} ${usuario?.nombres ?? ''}`.trim(),
    };
  });

  // stable sort: compare apellido, then nombres, then enrollment_date (fecha_matricula)
  normalized.sort((a, b) => {
    const ap = a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' });
    if (ap !== 0) return ap;
    const nm = a.nombres.localeCompare(b.nombres, 'es', { sensitivity: 'base' });
    if (nm !== 0) return nm;
    // Compare dates safely: null/undefined move before/after? We'll treat null/undefined as larger (after)
    const da = a.enrollment_date ? new Date(a.enrollment_date).getTime() : Number.POSITIVE_INFINITY;
    const db = b.enrollment_date ? new Date(b.enrollment_date).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });

  return normalized.map(item => ({
    id: item.id,
    registration_number: item.registration_number,
    enrollment_date: item.enrollment_date,
    withdrawal_date: item.withdrawal_date,
    name: item.name,
  }));
}
