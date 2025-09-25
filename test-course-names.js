// Verificar formato de nombres de curso
console.log('🎓 Verificando nuevo formato de nombres de curso...\n');

// Simular datos para probar la lógica
const testCases = [
  {
    nivel: 1,
    letra: 'A',
    tipo_educacion: 'Enseñanza Media Técnico Profesional',
    expected: '1º Medio TP A'
  },
  {
    nivel: 2,
    letra: 'B',
    tipo_educacion: 'Educación Media Humanístico Científica',
    expected: '2º Medio B'
  },
  {
    nivel: 8,
    letra: 'C',
    tipo_educacion: 'Educación Básica',
    expected: '8 C'
  }
];

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. Prueba con ${testCase.tipo_educacion}:`);
  
  let nombre_curso = '';
  const tipoEducacion = testCase.tipo_educacion;
  
  if (tipoEducacion && tipoEducacion.toLowerCase().includes('enseñanza media técnico')) {
    nombre_curso = `${testCase.nivel}º Medio TP ${testCase.letra}`;
  } else if (tipoEducacion && tipoEducacion.toLowerCase().includes('educación media')) {
    nombre_curso = `${testCase.nivel}º Medio ${testCase.letra}`;
  } else {
    nombre_curso = `${testCase.nivel} ${testCase.letra}`;
  }
  
  console.log(`   Input: Nivel ${testCase.nivel}, Letra ${testCase.letra}`);
  console.log(`   Tipo: ${tipoEducacion}`);
  console.log(`   Resultado: "${nombre_curso}"`);
  console.log(`   Esperado:  "${testCase.expected}"`);
  console.log(`   ${nombre_curso === testCase.expected ? '✅ CORRECTO' : '❌ ERROR'}\n`);
});

console.log('📱 Para verificar en vivo, visita:');
console.log('http://localhost:9001/dashboard/admin/courses/803d0ffc-6104-4902-939e-e36bc55319be/details');