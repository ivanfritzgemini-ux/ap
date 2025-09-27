// Script para probar la lógica de cálculo de días hábiles para diferentes meses
console.log('🧪 PRUEBA DE LÓGICA DE DÍAS HÁBILES POR MES\n');

// Función que simula la lógica del endpoint
function calcularDiasHabiles(mes, año) {
  // Para marzo, el período de asistencia comienza el 5 de marzo
  const diaInicioMes = (mes === 3) ? 5 : 1;
  const primerDia = `${año}-${mes.toString().padStart(2, '0')}-${diaInicioMes.toString().padStart(2, '0')}`;
  const ultimoDia = new Date(año, mes, 0).toISOString().split('T')[0];

  // Calcular días hábiles del mes
  const diasHabiles = [];
  const diasEnMes = new Date(año, mes, 0).getDate();

  for (let dia = diaInicioMes; dia <= diasEnMes; dia++) {
    const fecha = new Date(año, mes - 1, dia);
    const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado

    // Solo incluir días de lunes a viernes
    if (diaSemana > 0 && diaSemana < 6) {
      diasHabiles.push(fecha.toISOString().split('T')[0]);
    }
  }

  return {
    mes,
    año,
    diaInicioMes,
    primerDia,
    ultimoDia,
    diasEnMes,
    diasHabiles,
    totalDiasHabiles: diasHabiles.length
  };
}

// Probar diferentes meses
const meses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const año = 2025;

console.log(`📅 PRUEBAS PARA EL AÑO ${año}\n`);

meses.forEach(mes => {
  const resultado = calcularDiasHabiles(mes, año);
  const nombreMes = new Date(año, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long' });

  console.log(`📊 ${nombreMes} ${año}:`);
  console.log(`   - Día inicio: ${resultado.diaInicioMes}`);
  console.log(`   - Primer día: ${resultado.primerDia}`);
  console.log(`   - Último día: ${resultado.ultimoDia}`);
  console.log(`   - Días hábiles: ${resultado.totalDiasHabiles}`);
  console.log(`   - Fechas hábiles: ${resultado.diasHabiles.slice(0, 5).join(', ')}${resultado.diasHabiles.length > 5 ? '...' : ''}`);
  console.log('');
});

// Verificar específicamente marzo
console.log('🔍 ANÁLISIS DETALLADO DE MARZO 2025:');
const marzo = calcularDiasHabiles(3, 2025);
console.log(`   - Días hábiles en marzo: ${marzo.totalDiasHabiles}`);
console.log(`   - Primer día hábil: ${marzo.diasHabiles[0]}`);
console.log(`   - Último día hábil: ${marzo.diasHabiles[marzo.diasHabiles.length - 1]}`);

// Comparar con otros meses
console.log('\n📈 COMPARACIÓN:');
const enero = calcularDiasHabiles(1, 2025);
const abril = calcularDiasHabiles(4, 2025);
console.log(`   - Enero: ${enero.totalDiasHabiles} días hábiles`);
console.log(`   - Marzo: ${marzo.totalDiasHabiles} días hábiles`);
console.log(`   - Abril: ${abril.totalDiasHabiles} días hábiles`);

console.log('\n✅ PRUEBA COMPLETADA');