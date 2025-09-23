import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  
  try {
    // Get all registration numbers to find the maximum numeric value
    const { data, error } = await supabase
      .from('estudiantes_detalles')
      .select('nro_registro')
      .not('nro_registro', 'is', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    if (!data || data.length === 0) {
      return NextResponse.json({ last: null })
    }

    // Find the maximum numeric registration number
    let maxNumber = 0
    data.forEach(row => {
      const registryValue = row.nro_registro
      if (registryValue) {
        // Extract numeric value from the registration number
        const numericPart = parseInt(String(registryValue).replace(/\D/g, ''), 10)
        if (!isNaN(numericPart) && numericPart > maxNumber) {
          maxNumber = numericPart
        }
      }
    })

    return NextResponse.json({ last: maxNumber > 0 ? String(maxNumber) : null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching last registry' }, { status: 500 })
  }
}
