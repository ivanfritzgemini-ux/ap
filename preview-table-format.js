// Script para generar una vista previa de cómo se verán los datos en la tabla
const estudiantesMuestra = [
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
  },
  {
    id: '3',
    nombre: 'Catalina Anaís Marimán Huenteo', 
    curso_id: '1',
    nombre_curso: '1A',
    dias_asistidos: 21,
    total_dias_obligatorios: 21
  },
  {
    id: '4',
    nombre: 'Deveneau Toussaint',
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
    nombre: 'Leonardo Antonio Correa Alvarado',
    curso_id: '1',
    nombre_curso: '1A',
    dias_asistidos: 21, 
    total_dias_obligatorios: 21
  }
];

// Simular el ordenamiento que hace el componente
const estudiantesOrdenados = [...estudiantesMuestra].sort((a, b) => a.nombre.localeCompare(b.nombre));

console.log('📋 VISTA PREVIA DE LA TABLA DE ESTUDIANTES CON 100% ASISTENCIA');
console.log('=' * 70);
console.log('');

// Simular la tabla
console.log('┌─────────────────────────────────────┬────────┬──────────────────┐');
console.log('│ Nombre del Estudiante               │ Curso  │ Días Asistidos   │');
console.log('├─────────────────────────────────────┼────────┼──────────────────┤');

estudiantesOrdenados.forEach((estudiante, index) => {
  const nombre = estudiante.nombre.padEnd(35);
  const curso = estudiante.nombre_curso.padEnd(6);
  const dias = `${estudiante.dias_asistidos}/${estudiante.total_dias_obligatorios} (100%)`.padEnd(16);
  
  console.log(`│ ${nombre} │ ${curso} │ ${dias} │`);
  
  // Agregar separador entre filas excepto la última
  if (index < estudiantesOrdenados.length - 1) {
    console.log('├─────────────────────────────────────┼────────┼──────────────────┤');
  }
});

console.log('└─────────────────────────────────────┴────────┴──────────────────┘');

console.log('');
console.log('📊 ESTADÍSTICAS:');
console.log(`Total de estudiantes: ${estudiantesOrdenados.length}`);
console.log(`Cursos representados: ${[...new Set(estudiantesOrdenados.map(e => e.nombre_curso))].join(', ')}`);
console.log('');
console.log('✅ Ordenamiento: Los estudiantes están ordenados alfabéticamente por nombre');
console.log('✅ Formato: La tabla incluye todas las columnas solicitadas');
console.log('✅ Datos: Cada fila muestra nombre completo, curso y días asistidos con porcentaje');

// Mostrar también el orden alfabético
console.log('');
console.log('📝 ORDEN ALFABÉTICO APLICADO:');
estudiantesOrdenados.forEach((estudiante, index) => {
  console.log(`${index + 1}. ${estudiante.nombre}`);
});

console.log('');
console.log('🎨 CARACTERÍSTICAS DE LA VISUALIZACIÓN:');
console.log('- Tabla responsive con scroll vertical');
console.log('- Cabeceras claramente definidas');
console.log('- Badge para mostrar el curso');
console.log('- Indicador visual de 100% de asistencia');
console.log('- Hover effect en las filas');
console.log('- Datos ordenados alfabéticamente por nombre del estudiante');