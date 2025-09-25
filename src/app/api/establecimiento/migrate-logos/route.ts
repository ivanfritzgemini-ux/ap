import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    
    // Obtener todos los establecimientos con logos
    const { data: establecimientos, error: fetchError } = await supabase
      .from('establecimientos')
      .select('id, logo')
      .not('logo', 'is', null)
      .neq('logo', '');

    if (fetchError) {
      return NextResponse.json({ 
        error: fetchError.message 
      }, { status: 500 });
    }

    let migrated = 0;
    const results = [];

    for (const establecimiento of establecimientos || []) {
      const { id, logo } = establecimiento;
      
      // Si el logo no empieza con /uploads/, necesita ser migrado
      if (logo && !logo.startsWith('/uploads/') && !logo.startsWith('http')) {
        // Construir nueva URL
        let newLogoUrl;
        
        // Si parece ser un nombre de archivo, agregarlo a la nueva estructura
        if (logo.includes('.')) {
          newLogoUrl = `/uploads/logos/${logo}`;
        } else {
          // Si no tiene extensión, asumir que es un path incompleto
          newLogoUrl = `/uploads/logos/${logo}.png`;
        }

        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('establecimientos')
          .update({ logo: newLogoUrl })
          .eq('id', id);

        if (!updateError) {
          migrated++;
          results.push({
            id,
            oldLogo: logo,
            newLogo: newLogoUrl,
            status: 'migrated'
          });
        } else {
          results.push({
            id,
            oldLogo: logo,
            error: updateError.message,
            status: 'error'
          });
        }
      } else {
        results.push({
          id,
          logo,
          status: 'skipped - already correct format'
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      migrated,
      total: establecimientos?.length || 0,
      results
    });

  } catch (error) {
    console.error('Error in logo migration:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}