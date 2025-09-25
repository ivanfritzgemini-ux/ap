// Script de prueba para verificar el badge de traslado
const testBadgeLogic = () => {
  console.log('=== Prueba de lógica del badge de traslado ===\n');

  // Casos de prueba
  const testCases = [
    {
      name: 'Estudiante activo con historial de traslado',
      student: {
        nombres: 'Juan',
        apellidos: 'Pérez',
        fecha_retiro: undefined,
        motivo_retiro: undefined,
        tiene_traslado: true
      },
      expected: 'Badge Traslado (azul)'
    },
    {
      name: 'Estudiante retirado por traslado interno',
      student: {
        nombres: 'María',
        apellidos: 'González',
        fecha_retiro: '2024-09-20',
        motivo_retiro: 'Traslado interno',
        tiene_traslado: false
      },
      expected: 'Badge Traslado (azul)'
    },
    {
      name: 'Estudiante retirado por cambio de curso',
      student: {
        nombres: 'Carlos',
        apellidos: 'Ramírez',
        fecha_retiro: '2024-09-15',
        motivo_retiro: 'Cambio de curso',
        tiene_traslado: false
      },
      expected: 'Badge Traslado (azul)'
    },
    {
      name: 'Estudiante retirado por otra razón',
      student: {
        nombres: 'Ana',
        apellidos: 'López',
        fecha_retiro: '2024-09-10',
        motivo_retiro: 'Cambio de ciudad',
        tiene_traslado: false
      },
      expected: 'Badge Retirado (rojo)'
    },
    {
      name: 'Estudiante activo sin traslados',
      student: {
        nombres: 'Pedro',
        apellidos: 'Martín',
        fecha_retiro: undefined,
        motivo_retiro: undefined,
        tiene_traslado: false
      },
      expected: 'Sin badge'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}:`);
    console.log(`   Datos:`, testCase.student);
    
    // Simular la lógica del badge
    const student = testCase.student;
    let badgeResult = 'Sin badge';
    
    // Badge de Traslado
    if ((student.tiene_traslado && !student.fecha_retiro) || 
        (student.fecha_retiro && student.motivo_retiro && (
          student.motivo_retiro.toLowerCase().includes('traslado') || 
          student.motivo_retiro.toLowerCase().includes('cambio de curso')
        ))) {
      badgeResult = 'Badge Traslado (azul)';
    }
    // Badge de Retirado
    else if (student.fecha_retiro && !(student.motivo_retiro && (
      student.motivo_retiro.toLowerCase().includes('traslado') || 
      student.motivo_retiro.toLowerCase().includes('cambio de curso')
    ))) {
      badgeResult = 'Badge Retirado (rojo)';
    }
    
    console.log(`   Resultado: ${badgeResult}`);
    console.log(`   Esperado:  ${testCase.expected}`);
    console.log(`   ✅ ${badgeResult === testCase.expected ? 'CORRECTO' : '❌ ERROR'}\n`);
  });
};

// Ejecutar la prueba
testBadgeLogic();