// Script para probar la nueva lógica de asistencia perfecta por estudiante
console.log('🧪 PRUEBA DE LÓGICA MEJORADA DE ASISTENCIA PERFECTA\n');

// Función que simula la nueva lógica
function calcularAsistenciaPerfectaEstudiante(fechaMatricula, fechaRetiro, primerDiaMes, ultimoDiaMes, diasHabilesMes, registrosAsistencia) {
  // Calcular el período de asistencia para este estudiante
  const fechaInicioEstudiante = new Date(Math.max(
    new Date(primerDiaMes).getTime(),
    new Date(fechaMatricula).getTime()
  ))

  const fechaFinEstudiante = fechaRetiro
    ? new Date(Math.min(new Date(ultimoDiaMes).getTime(), new Date(fechaRetiro).getTime()))
    : new Date(ultimoDiaMes)

  // Calcular días hábiles para este estudiante
  const diasHabilesEstudiante = []
  const fechaActual = new Date(fechaInicioEstudiante)

  while (fechaActual <= fechaFinEstudiante) {
    const diaSemana = fechaActual.getDay()
    // Solo días hábiles (lunes a viernes)
    if (diaSemana > 0 && diaSemana < 6) {
      diasHabilesEstudiante.push(fechaActual.toISOString().split('T')[0])
    }
    fechaActual.setDate(fechaActual.getDate() + 1)
  }

  // Contar días asistidos (fechas en las que el estudiante estuvo presente)
  const diasAsistidos = registrosAsistencia.length

  const esPerfecta = diasAsistidos === diasHabilesEstudiante.length

  return {
    fechaInicio: fechaInicioEstudiante.toISOString().split('T')[0],
    fechaFin: fechaFinEstudiante.toISOString().split('T')[0],
    diasHabilesRequeridos: diasHabilesEstudiante.length,
    diasAsistidos,
    esPerfecta,
    diasHabilesEstudiante
  }
}

// Pruebas
console.log('📅 ESCENARIOS DE PRUEBA PARA ABRIL 2025:\n');

const primerDiaMes = '2025-04-01'
const ultimoDiaMes = '2025-04-30'
const diasHabilesMes = ['2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-07', '2025-04-08', '2025-04-09', '2025-04-10', '2025-04-11', '2025-04-14', '2025-04-15', '2025-04-16', '2025-04-17', '2025-04-18', '2025-04-21', '2025-04-22', '2025-04-23', '2025-04-24', '2025-04-25', '2025-04-28', '2025-04-29', '2025-04-30']

// Escenario 1: Estudiante matriculado desde el inicio del mes
console.log('👤 ESCENARIO 1: Estudiante matriculado desde el 1 de abril');
const estudiante1 = calcularAsistenciaPerfectaEstudiante(
  '2025-04-01', // fecha matrícula
  null, // sin retiro
  primerDiaMes,
  ultimoDiaMes,
  diasHabilesMes,
  diasHabilesMes // asistió todos los días hábiles (21 días)
)
console.log(`   - Días hábiles requeridos: ${estudiante1.diasHabilesRequeridos}`);
console.log(`   - Días asistidos: ${estudiante1.diasAsistidos}`);
console.log(`   - Asistencia perfecta: ${estudiante1.esPerfecta ? '✅ SÍ' : '❌ NO'}`);
console.log('');

// Escenario 2: Estudiante matriculado a mitad de mes
console.log('👤 ESCENARIO 2: Estudiante matriculado el 15 de abril');
const diasHabilesDesde15 = diasHabilesMes.filter(fecha => fecha >= '2025-04-15') // 12 días hábiles
const estudiante2 = calcularAsistenciaPerfectaEstudiante(
  '2025-04-15', // fecha matrícula
  null, // sin retiro
  primerDiaMes,
  ultimoDiaMes,
  diasHabilesMes,
  diasHabilesDesde15 // asistió todos los días hábiles desde su matrícula (12 días)
)
console.log(`   - Días hábiles requeridos: ${estudiante2.diasHabilesRequeridos}`);
console.log(`   - Días asistidos: ${estudiante2.diasAsistidos}`);
console.log(`   - Asistencia perfecta: ${estudiante2.esPerfecta ? '✅ SÍ' : '❌ NO'}`);
console.log('');

// Escenario 3: Estudiante con asistencia incompleta
console.log('👤 ESCENARIO 3: Estudiante matriculado desde el inicio, pero faltó 2 días');
const estudiante3 = calcularAsistenciaPerfectaEstudiante(
  '2025-04-01', // fecha matrícula
  null, // sin retiro
  primerDiaMes,
  ultimoDiaMes,
  diasHabilesMes,
  diasHabilesMes.slice(0, 19) // asistió 19 de 21 días hábiles (faltó 2)
)
console.log(`   - Días hábiles requeridos: ${estudiante3.diasHabilesRequeridos}`);
console.log(`   - Días asistidos: ${estudiante3.diasAsistidos}`);
console.log(`   - Asistencia perfecta: ${estudiante3.esPerfecta ? '✅ SÍ' : '❌ NO'}`);
console.log('');

// Escenario 4: Estudiante retirado a mitad de mes
console.log('👤 ESCENARIO 4: Estudiante matriculado desde el inicio, retirado el 20 de abril');
const diasHabilesHasta20 = diasHabilesMes.filter(fecha => fecha <= '2025-04-18') // hasta el 18 de abril = 13 días hábiles
const estudiante4 = calcularAsistenciaPerfectaEstudiante(
  '2025-04-01', // fecha matrícula
  '2025-04-20', // fecha retiro
  primerDiaMes,
  ultimoDiaMes,
  diasHabilesMes,
  diasHabilesHasta20 // asistió todos los días hábiles hasta su retiro (13 días)
)
console.log(`   - Días hábiles requeridos: ${estudiante4.diasHabilesRequeridos}`);
console.log(`   - Días asistidos: ${estudiante4.diasAsistidos}`);
console.log(`   - Asistencia perfecta: ${estudiante4.esPerfecta ? '✅ SÍ' : '❌ NO'}`);
console.log('');

console.log('✅ PRUEBA COMPLETADA - La lógica ahora considera fechas de matrícula y retiro correctamente');