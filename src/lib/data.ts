import type { User } from './types';
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
    name: `${user.nombres} ${user.apellidos}`,
    email: user.email,
    rut: user.rut,
    // @ts-ignore
    gender: user.sexo?.nombre,
    // @ts-ignore
    role: user.rol?.nombre_rol,
  }));
}
