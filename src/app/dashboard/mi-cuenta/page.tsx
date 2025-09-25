import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/dashboard/profile-client";

export default async function MiCuentaPage() {
  const supabase = await createServerClient();
  
  // Obtener el usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // Obtener datos completos del usuario desde la base de datos
  const { data: userData, error: userError } = await supabase
    .from('usuarios')
    .select(`
      id,
      rut,
      nombres,
      apellidos,
      email,
      telefono,
      direccion,
      fecha_nacimiento,
      foto_perfil,
      sexo:sexo_id(id, nombre),
      rol:rol_id(id, nombre_rol)
    `)
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user data:', userError);
  }

  // Formatear los datos del usuario
  const formattedUser = userData ? {
    id: userData.id,
    rut: userData.rut || '',
    nombres: userData.nombres || '',
    apellidos: userData.apellidos || '',
    email: userData.email || user.email || '',
    telefono: userData.telefono || '',
    direccion: userData.direccion || '',
    fecha_nacimiento: userData.fecha_nacimiento || '',
    foto_perfil: userData.foto_perfil || '',
    // @ts-ignore
    sexo: userData.sexo?.nombre || '',
    // @ts-ignore
    sexo_id: userData.sexo?.id || null,
    // @ts-ignore  
    rol: userData.rol?.nombre_rol || '',
    // @ts-ignore
    rol_id: userData.rol?.id || null,
  } : {
    id: user.id,
    rut: '',
    nombres: '',
    apellidos: '',
    email: user.email || '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    foto_perfil: '',
    sexo: '',
    sexo_id: null,
    rol: '',
    rol_id: null,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mi Cuenta</h2>
          <p className="text-muted-foreground">
            Administra tu información personal y configuración de cuenta.
          </p>
        </div>
      </div>
      
      <ProfileClient user={formattedUser} />
    </div>
  );
}