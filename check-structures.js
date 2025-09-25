// Script para verificar estructura de usuarios
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

async function checkStructures() {
  const supabase = createServiceRoleClient()
  
  try {
    console.log('=== ESTRUCTURA USUARIOS ===')
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)

    if (usuariosError) {
      console.error('Error usuarios:', usuariosError)
    } else if (usuariosData && usuariosData.length > 0) {
      console.log('Columnas usuarios:', Object.keys(usuariosData[0]))
      console.log('Datos muestra usuarios:', usuariosData[0])
    }

    console.log('\n=== ESTRUCTURA CURSOS ===')
    const { data: cursosData, error: cursosError } = await supabase
      .from('cursos')
      .select('*')
      .limit(1)

    if (cursosError) {
      console.error('Error cursos:', cursosError)
    } else if (cursosData && cursosData.length > 0) {
      console.log('Columnas cursos:', Object.keys(cursosData[0]))
      console.log('Datos muestra cursos:', cursosData[0])
    }

  } catch (error) {
    console.error('Error general:', error)
  }
}

checkStructures()