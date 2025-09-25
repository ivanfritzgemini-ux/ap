// Script para verificar qué tablas existen en la base de datos
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

// Crear cliente de Supabase con role de servicio
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function checkDatabaseTables() {
  console.log('🔍 Verificando tablas existentes en la base de datos...')
  
  const supabase = createServiceRoleClient()
  
  try {
    // Verificar específicamente tablas relacionadas con estudiantes y asistencia
    console.log('\n🔍 Verificando tablas relacionadas con asistencia y estudiantes:')
    
    const tablasRelevantes = ['estudiantes_detalles', 'cursos', 'asistencia', 'usuarios', 'roles']
    
    for (const tabla of tablasRelevantes) {
      try {
        // Intentar hacer una query simple para ver si la tabla existe
        const { data, error } = await supabase
          .from(tabla)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ ${tabla} - Error: ${error.message}`)
        } else {
          console.log(`✅ ${tabla} - Existe (${data ? data.length : 0} registros de muestra)`)
        }
      } catch (err) {
        console.log(`❌ ${tabla} - No existe o error de acceso`)
      }
    }

    // Si existe estudiantes_detalles, obtener una muestra de datos
    if (tablesData.some(t => t.table_name === 'estudiantes_detalles')) {
      console.log('\n📊 Muestra de estudiantes:')
      const { data: estudiantesData, error: estudiantesError } = await supabase
        .from('estudiantes_detalles')
        .select('id, nombre, apellido_paterno, es_matricula_actual')
        .limit(5)

      if (!estudiantesError && estudiantesData) {
        estudiantesData.forEach(est => {
          console.log(`   ${est.nombre} ${est.apellido_paterno} (Matrícula actual: ${est.es_matricula_actual ? 'Sí' : 'No'})`)
        })
      }
    }

    // Si existe cursos, obtener una muestra de datos
    if (tablesData.some(t => t.table_name === 'cursos')) {
      console.log('\n📚 Muestra de cursos:')
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select('id, nombre_curso, nivel, activo')
        .limit(5)

      if (!cursosError && cursosData) {
        cursosData.forEach(curso => {
          console.log(`   ${curso.nombre_curso} - Nivel: ${curso.nivel} (Activo: ${curso.activo ? 'Sí' : 'No'})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
checkDatabaseTables()
  .then(() => {
    console.log('\n✅ Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })