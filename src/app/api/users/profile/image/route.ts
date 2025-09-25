import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Imagen y ID de usuario son requeridos' 
      }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Verificar que el usuario autenticado es el mismo que está subiendo la imagen
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser || authUser.id !== userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autorizado para subir imagen a este perfil' 
      }, { status: 403 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'El archivo debe ser una imagen' 
      }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'La imagen debe ser menor a 5MB' 
      }, { status: 400 });
    }

    // Crear nombre único para el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;
    
    // Guardar archivo en el directorio public/uploads/profiles
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    const filePath = join(uploadDir, fileName);
    
    try {
      // Crear directorio si no existe
      const { mkdir } = await import('fs/promises');
      await mkdir(uploadDir, { recursive: true });
      
      // Guardar archivo
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al guardar la imagen' 
      }, { status: 500 });
    }

    // Construir URL de la imagen
    const imageUrl = `/uploads/profiles/${fileName}`;

    // Actualizar la base de datos con la nueva URL de la imagen
    const { data, error } = await supabase
      .from('usuarios')
      .update({ 
        foto_perfil: imageUrl,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', userId)
      .select('foto_perfil')
      .single();

    if (error) {
      console.error('Error updating profile image in database:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error al actualizar la imagen en la base de datos' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: { foto_perfil: imageUrl },
      message: 'Imagen de perfil actualizada correctamente'
    });

  } catch (error) {
    console.error('Error in image upload endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}