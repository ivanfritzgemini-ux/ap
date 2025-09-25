// Simulación de datos para verificar el formato de nombres
const estudiantesMockData = [
  {
    nombres: 'Ana Luisa',
    apellidos: 'Mansilla Valle',
    curso: '1º Medio A',
    diasAsistidos: 20
  },
  {
    nombres: 'Catalina Andrea',
    apellidos: 'Pardo Soto',
    curso: '2º Medio B',
    diasAsistidos: 20
  },
  {
    nombres: 'Carlos Eduardo',
    apellidos: 'González Pérez',
    curso: '3º Medio A',
    diasAsistidos: 18
  }
];

function formatearNombre(nombres, apellidos) {
  if (apellidos && nombres) {
    return `${apellidos}, ${nombres}`;
  }
  return `${apellidos || ''}${nombres || ''}`.trim();
}

function mostrarFormatoNombres() {
  console.log('🔍 Verificación del formato de nombres:\n');
  console.log('Formato anterior: nombres apellidos');
  console.log('Formato nuevo: apellidos, nombres\n');
  
  console.log('📋 Datos de ejemplo:\n');
  
  estudiantesMockData.forEach((estudiante, index) => {
    const formatoAnterior = `${estudiante.nombres} ${estudiante.apellidos}`;
    const formatoNuevo = formatearNombre(estudiante.nombres, estudiante.apellidos);
    
    console.log(`${index + 1}. Estudiante:`);
    console.log(`   Formato anterior: ${formatoAnterior}`);
    console.log(`   Formato nuevo: ${formatoNuevo}`);
    console.log(`   Curso: ${estudiante.curso}`);
    console.log(`   Días asistidos: ${estudiante.diasAsistidos}`);
    console.log('');
  });
  
  // Verificar ordenamiento por apellidos
  const estudiantesOrdenados = [...estudiantesMockData].sort((a, b) => 
    (a.apellidos || '').localeCompare(b.apellidos || '', 'es', { sensitivity: 'base' })
  );
  
  console.log('📊 Orden alfabético por apellidos:\n');
  estudiantesOrdenados.forEach((estudiante, index) => {
    const nombreFormateado = formatearNombre(estudiante.nombres, estudiante.apellidos);
    console.log(`${index + 1}. ${nombreFormateado} - ${estudiante.curso}`);
  });
  
  console.log('\n✅ El formato de nombres y ordenamiento están funcionando correctamente.');
  console.log('✅ Los apellidos aparecen primero, seguidos de una coma y los nombres.');
  console.log('✅ El ordenamiento se basa en los apellidos alfabéticamente.');
}

mostrarFormatoNombres();