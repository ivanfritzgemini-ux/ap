console.log('=== PRUEBA DE API DE TENDENCIA DE ASISTENCIA ===\n');

const testAPI = async () => {
  try {
    console.log('🔄 Realizando consulta a /api/asistencia/tendencia...\n');
    
    const response = await fetch('http://localhost:3000/api/asistencia/tendencia');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error}`);
    }
    
    console.log('✅ Respuesta exitosa:');
    console.log('──────────────────────');
    
    if (data.success && data.tendencia) {
      console.log(`📊 Total de meses con datos: ${data.tendencia.length}`);
      console.log(`📅 Año escolar: ${data.añoEscolar}\n`);
      
      if (data.estadisticas) {
        console.log('📈 ESTADÍSTICAS GENERALES:');
        console.log(`   • Promedio general: ${data.estadisticas.promedioGeneral}%`);
        console.log(`   • Tendencia: ${data.estadisticas.tendenciaGeneral}`);
        console.log(`   • Mejor mes: ${data.estadisticas.mejorMes.nombre} (${data.estadisticas.mejorMes.porcentaje}%)`);
        console.log(`   • Peor mes: ${data.estadisticas.peorMes.nombre} (${data.estadisticas.peorMes.porcentaje}%)\n`);
      }
      
      console.log('📅 DATOS MENSUALES:');
      console.log('───────────────────');
      
      data.tendencia.forEach((mes, index) => {
        const trend = mes.diferencia > 0 ? '📈' : mes.diferencia < 0 ? '📉' : '➖';
        const diferencia = mes.diferencia !== 0 ? ` (${mes.diferencia > 0 ? '+' : ''}${mes.diferencia}%)` : '';
        
        console.log(`${index + 1}. ${mes.nombre_mes} ${mes.año}: ${mes.porcentaje}% ${trend}${diferencia}`);
        console.log(`   Registros: ${mes.presentes}/${mes.total_registros}`);
      });
      
    } else {
      console.log('⚠️  Sin datos de tendencia disponibles');
      console.log('   Mensaje:', data.mensaje || 'No especificado');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
};

// Función para simular datos si no hay datos reales
const mostrarEstructuraEsperada = () => {
  console.log('\n🔧 ESTRUCTURA ESPERADA DE LA API:');
  console.log('─────────────────────────────────');
  
  const ejemploRespuesta = {
    success: true,
    tendencia: [
      {
        mes: 3,
        año: 2025,
        nombre_mes: 'Marzo',
        porcentaje: 92,
        diferencia: 0,
        total_registros: 450,
        presentes: 414
      }
    ],
    estadisticas: {
      promedioGeneral: 89,
      tendenciaGeneral: 'al_alza',
      mejorMes: { nombre: 'Marzo', porcentaje: 92 },
      peorMes: { nombre: 'Julio', porcentaje: 85 },
      totalMeses: 6
    },
    añoEscolar: 2025
  };
  
  console.log(JSON.stringify(ejemploRespuesta, null, 2));
};

// Ejecutar las pruebas
testAPI().then(() => {
  mostrarEstructuraEsperada();
});