const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://irdrfncnhgjutihnuhme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZHJmbmNuaGdqdXRpaG51aG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0ODcxOTEsImV4cCI6MjA1MTA2MzE5MX0.F0H6Kxlx-E4SgAOnpsGAk2nieyXpBvbHvTEJEgPUNdE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstructuraAsistencia() {
  console.log('🔍 Verificando estructura de la tabla asistencia...\n');
  
  try {
    // Obtener algunos registros de asistencia para ver la estructura
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No hay registros en la tabla asistencia');
      return;
    }

    console.log('📊 Estructura de la tabla asistencia:');
    console.log('Columnas encontradas:', Object.keys(data[0]));
    console.log('\n📋 Ejemplo de registro:');
    console.log(JSON.stringify(data[0], null, 2));
    
  } catch (err) {
    console.error('❌ Error durante la verificación:', err.message);
  }
}

verificarEstructuraAsistencia();