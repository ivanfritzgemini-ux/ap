import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ 
        error: 'No se encontró archivo' 
      }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Verificar que el usuario esté autenticado y tenga permisos
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No autorizado' 
      }, { status: 403 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'El archivo debe ser una imagen' 
      }, { status: 400 });
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'La imagen debe ser menor a 10MB' 
      }, { status: 400 });
    }

    // Crear nombre único para el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `logo_${Date.now()}.${fileExtension}`;
    
    // Guardar archivo en el directorio public/uploads/logos
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos');
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
        error: 'Error al guardar la imagen' 
      }, { status: 500 });
    }

    // Construir URL de la imagen
    const imageUrl = `/uploads/logos/${fileName}`;

    return NextResponse.json({ 
      path: imageUrl,
      publicUrl: imageUrl,
      message: 'Logo subido correctamente'
    });

  } catch (error) {
    console.error('Error in logo upload endpoint:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
