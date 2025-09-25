// Script para verificar estructura de estudiantes_detalles
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

async function checkStudentStructure() {
  const supabase = createServiceRoleClient()
  
  try {
    const { data, error } = await supabase
      .from('estudiantes_detalles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error:', error)
      return
    }

    console.log('Estructura de estudiantes_detalles:')
    if (data && data.length > 0) {
      console.log('Columnas disponibles:', Object.keys(data[0]))
      console.log('Datos de muestra:', data[0])
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkStudentStructure()