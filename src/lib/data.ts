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
    `);

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data.map((student) => {
    const tipoEducacion = student.cursos?.tipo_educacion?.nombre ?? '';
    let nombreAbreviado = tipoEducacion;
    if (tipoEducacion.includes('Media')) {
      nombreAbreviado = 'Medio';
    }

    return {
      id: student.id,
      rut: student.usuarios?.rut ?? 'N/A',
      nombres: student.usuarios?.nombres ?? 'N/A',
      apellidos: student.usuarios?.apellidos ?? 'N/A',
      email: student.usuarios?.email ?? 'N/A',
      sexo: student.usuarios?.sexo?.nombre ?? 'N/A',
      curso: student.cursos ? `${student.cursos.nivel}º ${nombreAbreviado} ${student.cursos.letra}` : 'Sin curso',
    };
  });
}
