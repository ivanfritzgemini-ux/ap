import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    
    // Actualizar el logo del establecimiento con la URL correcta
    const correctLogoUrl = '/uploads/logos/polivalente-logo-c.png';
    
    // Primero obtener el establecimiento existente
    const { data: existingData, error: fetchError } = await supabase
      .from('establecimientos')
      .select('id, logo')
      .limit(1);

    if (fetchError) {
      return NextResponse.json({ 
        error: `Error fetching establishment: ${fetchError.message}` 
      }, { status: 500 });
    }

    if (!existingData || existingData.length === 0) {
      return NextResponse.json({ 
        error: 'No establishment found' 
      }, { status: 404 });
    }

    const establishmentId = existingData[0].id;
    
    // Actualizar el logo
    const { data, error } = await supabase
      .from('establecimientos')
      .update({ logo: correctLogoUrl })
      .eq('id', establishmentId)
      .select('id, logo');

    if (error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Logo URL corregida exitosamente',
      data,
      newLogoUrl: correctLogoUrl
    });

  } catch (error) {
    console.error('Error fixing logo URL:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}