// Script para mostrar cómo se verán los datos reales en la nueva tabla
const datosRealesPorMes = {
  marzo2025: [
    {
      id: '1',
      nombre: 'Ana Luisa Mansilla Valle',
      curso_id: '1',
      nombre_curso: '1A',
      dias_asistidos: 19,
      total_dias_obligatorios: 19
    },
    {
      id: '2', 
      nombre: 'Catalina Andrea Pardo Soto',
      curso_id: '1',
      nombre_curso: '1A',
      dias_asistidos: 9,
      total_dias_obligatorios: 9
    }
  ],
  abril2025: [
    {
      id: '1',
      nombre: 'Ana Luisa Mansilla Valle',
      curso_id: '1',
      nombre_curso: '1A',
      dias_asistidos: 21,
      total_dias_obligatorios: 21
    },
    {
      id: '2',
      nombre: 'Catalina Anaís Marimán Huenteo', 
      curso_id: '1',
      nombre_curso: '1A',
      dias_asistidos: 21,
      total_dias_obligatorios: 21
    },
    {
      id: '3',
      nombre: 'Deveneau Toussaint',
      curso_id: '1', 
      nombre_curso: '1A',
      dias_asistidos: 21,
      total_dias_obligatorios: 21
    },
    {
      id: '4',
      nombre: 'Djinaylove Xavier',
      curso_id: '1',
      nombre_curso: '1A', 
      dias_asistidos: 21,
      total_dias_obligatorios: 21
    },
    {
      id: '5',
      nombre: 'Martina Fernanda Mora Villegas',
      curso_id: '2',
      nombre_curso: '1B', 
      dias_asistidos: 21,
      total_dias_obligatorios: 21
    },
    {
      id: '6',
      nombre: 'Catalina Andrea Pardo Soto',
      curso_id: '1',
      nombre_curso: '1A',
      dias_asistidos: 21, 
      total_dias_obligatorios: 21
    },
    {
      id: '7',
      nombre: 'Leonardo Antonio Correa Alvarado',
      curso_id: '1',
      nombre_curso: '1A',
      dias_asistidos: 21, 
      total_dias_obligatorios: 21
    }
  ]
};

function mostrarTablaParaMes(nombreMes, estudiantes) {
  console.log(`\n📋 TABLA PARA ${nombreMes.toUpperCase()}`);
  console.log('=' * 60);
  
  if (estudiantes.length === 0) {
    console.log('💡 Resumen: 0 estudiantes con 100% de asistencia');
    console.log('📄 Mensaje: No hay datos disponibles para este mes');
    return;
  }

  // Ordenar alfabéticamente
  const estudiantesOrdenados = [...estudiantes].sort((a, b) => a.nombre.localeCompare(b.nombre));
  
  console.log(`💡 Resumen: ${estudiantes.length} estudiante${estudiantes.length !== 1 ? 's' : ''} con 100% de asistencia - Ordenado alfabéticamente`);
  console.log('');
  
  // Mostrar tabla
  console.log('┌─────────────────────────────────────┬────────┬──────────────────┐');
  console.log('│ Nombre del Estudiante               │ Curso  │ Días Asistidos   │');
  console.log('├─────────────────────────────────────┼────────┼──────────────────┤');

  estudiantesOrdenados.forEach((estudiante, index) => {
    const nombre = estudiante.nombre.length > 35 
      ? estudiante.nombre.substring(0, 32) + '...'
      : estudiante.nombre.padEnd(35);
    const curso = estudiante.nombre_curso.padEnd(6);
    const dias = `${estudiante.dias_asistidos}/${estudiante.total_dias_obligatorios} (100%)`.padEnd(16);
    
    console.log(`│ ${nombre} │ ${curso} │ ${dias} │`);
    
    if (index < estudiantesOrdenados.length - 1) {
      console.log('├─────────────────────────────────────┼────────┼──────────────────┤');
    }
  });

  console.log('└─────────────────────────────────────┴────────┴──────────────────┘');
  
  // Mostrar estadísticas adicionales
  const cursos = [...new Set(estudiantesOrdenados.map(e => e.nombre_curso))];
  console.log(`\n📊 Estadísticas:`);
  console.log(`   - Estudiantes: ${estudiantesOrdenados.length}`);
  console.log(`   - Cursos: ${cursos.join(', ')}`);
  console.log(`   - Rango de días: ${Math.min(...estudiantesOrdenados.map(e => e.dias_asistidos))} - ${Math.max(...estudiantesOrdenados.map(e => e.dias_asistidos))}`);
}

console.log('🎯 DEMOSTRACIÓN DEL NUEVO FORMATO DE TABLA');
console.log('📝 Columnas: Nombre del Estudiante | Curso | Días Asistidos');
console.log('🔤 Ordenamiento: Alfabético por nombre del estudiante');

// Mostrar datos para marzo
mostrarTablaParaMes('Marzo 2025', datosRealesPorMes.marzo2025);

// Mostrar datos para abril  
mostrarTablaParaMes('Abril 2025', datosRealesPorMes.abril2025);

// Mostrar caso sin datos
mostrarTablaParaMes('Septiembre 2025', []);

console.log('\n✅ CARACTERÍSTICAS IMPLEMENTADAS:');
console.log('✓ Tabla con cabeceras claras y descriptivas');
console.log('✓ Ordenamiento alfabético automático por nombre');
console.log('✓ Formato consistente: Nombre | Curso | Días Asistidos');
console.log('✓ Badges para cursos y indicador de 100%');
console.log('✓ Resumen estadístico en la parte superior');
console.log('✓ Scroll vertical para listas largas');
console.log('✓ Hover effects y diseño responsive');
console.log('✓ Manejo de casos sin datos con mensaje informativo');

console.log('\n🎨 MEJORAS DE UX:');
console.log('- Resumen visual del número de estudiantes');
console.log('- Indicación clara del ordenamiento aplicado');
console.log('- Formato compacto pero legible');
console.log('- Consistencia visual con el resto del dashboard');