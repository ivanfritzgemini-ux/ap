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
