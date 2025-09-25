import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, nombres, apellidos, rut, telefono, direccion, fecha_nacimiento, sexo_id } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de usuario requerido' 
      }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Verificar que el usuario autenticado es el mismo que se está actualizando
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser || authUser.id !== id) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autorizado para actualizar este perfil' 
      }, { status: 403 });
    }

    // Preparar los datos a actualizar
    const updateData: any = {};
    
    if (nombres !== undefined) updateData.nombres = nombres?.trim() || null;
    if (apellidos !== undefined) updateData.apellidos = apellidos?.trim() || null;
    if (rut !== undefined) updateData.rut = rut?.trim() || null;
    if (telefono !== undefined) updateData.telefono = telefono?.trim() || null;
    if (direccion !== undefined) updateData.direccion = direccion?.trim() || null;
    if (fecha_nacimiento !== undefined) updateData.fecha_nacimiento = fecha_nacimiento || null;
    if (sexo_id !== undefined) updateData.sexo_id = sexo_id;

    // Solo actualizar si hay campos válidos
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay campos válidos para actualizar' 
      }, { status: 400 });
    }

    // Actualizar la fecha de modificación
    updateData.actualizado_en = new Date().toISOString();

    // Ejecutar la actualización
    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
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
        sexo:sexo_id(nombre),
        rol:rol_id(nombre_rol),
        actualizado_en
      `)
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error('Error in profile update endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}