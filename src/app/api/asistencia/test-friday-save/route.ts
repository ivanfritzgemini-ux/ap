import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    console.log('🧪 Testing Friday attendance save/load cycle...')
    
    const supabase = createServiceRoleClient()
    
    // Use hard-coded IDs that we know exist (from the previous API call)
    const cursoId = '803d0ffc-6104-4902-939e-e36bc55319be'  // 1 A
    const estudianteId = 'c061c8ec-a516-411c-ac47-16184c5b349c'  // First student from API response
    
    if (!cursoId || !estudianteId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay cursos o estudiantes para la prueba' 
      })
    }
    
    // Test Friday dates in August 2025
    const fridayDates = [
      '2025-08-01', // Friday
      '2025-08-08', // Friday
      '2025-08-15', // Friday
      '2025-08-22', // Friday
      '2025-08-29'  // Friday
    ]
    
    console.log('Testing with curso:', cursoId, 'estudiante:', estudianteId)
    
    // Step 1: Clean existing Friday data
    console.log('🧹 Cleaning existing Friday data...')
    const { error: deleteError } = await supabase
      .from('asistencia')
      .delete()
      .eq('curso_id', cursoId)
      .eq('estudiante_id', estudianteId)
      .in('fecha', fridayDates)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
    }
    
    // Step 2: Create test attendance records for Fridays
    console.log('💾 Creating Friday attendance records...')
    const testRecords = fridayDates.map(fecha => ({
      estudiante_id: estudianteId,
      curso_id: cursoId,
      fecha: fecha,
      presente: true,
      justificado: false,
      tipo_ausencia: null,
      observaciones: `Test Friday attendance - ${fecha}`
    }))
    
    const { data: insertData, error: insertError } = await supabase
      .from('asistencia')
      .insert(testRecords)
      .select()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error inserting Friday records: ' + insertError.message 
      })
    }
    
    console.log('✅ Inserted', insertData?.length, 'Friday records')
    
    // Step 3: Read back the Friday records
    console.log('📖 Reading back Friday records...')
    const { data: readData, error: readError } = await supabase
      .from('asistencia')
      .select('*')
      .eq('curso_id', cursoId)
      .eq('estudiante_id', estudianteId)
      .in('fecha', fridayDates)
      .order('fecha')
    
    if (readError) {
      console.error('Read error:', readError)
      return NextResponse.json({ 
        success: false, 
        error: 'Error reading Friday records: ' + readError.message 
      })
    }
    
    console.log('📋 Found', readData?.length, 'Friday records')
    
    // Step 4: Test API endpoint read
    console.log('🔍 Testing API endpoint read...')
    const response = await fetch(`http://localhost:9001/api/asistencia?cursoId=${cursoId}&mes=8&año=2025`)
    const apiData = await response.json()
    
    const fridayRecordsFromAPI = apiData.data?.filter((record: any) => 
      fridayDates.includes(record.fecha) && record.estudiante_id === estudianteId
    ) || []
    
    console.log('🌐 API returned', fridayRecordsFromAPI.length, 'Friday records')
    
    return NextResponse.json({
      success: true,
      message: 'Friday attendance save/load test completed',
      testCurso: cursoId,
      testEstudiante: estudianteId,
      fridayDatesTesteadas: fridayDates,
      resultados: {
        recordsInserted: insertData?.length || 0,
        recordsReadDirect: readData?.length || 0,
        recordsReadAPI: fridayRecordsFromAPI.length,
        directReadData: readData,
        apiReadData: fridayRecordsFromAPI
      },
      conclusion: insertData?.length === readData?.length && readData?.length === fridayRecordsFromAPI.length
        ? 'Friday save/load works correctly'
        : 'Friday save/load has issues'
    })
    
  } catch (error: any) {
    console.error('Error in test-friday-save:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}