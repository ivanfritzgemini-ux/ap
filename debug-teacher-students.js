// Debug script para verificar el listado de estudiantes del profesor

console.log('=== INICIANDO DEBUG DEL LISTADO DE ESTUDIANTES ===');

// Verificar estructura de archivos
const fs = require('fs');
const path = require('path');

console.log('\n1. Verificando estructura de archivos:');

const files = [
  'src/app/dashboard/teacher/students/page.tsx',
  'src/components/dashboard/teacher/student-list.tsx',
  'src/lib/data.ts'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} existe`);
  } else {
    console.log(`❌ ${file} NO EXISTE`);
  }
});

// Verificar contenido del componente página
console.log('\n2. Contenido del page.tsx:');
try {
  const pageContent = fs.readFileSync(path.join(__dirname, 'src/app/dashboard/teacher/students/page.tsx'), 'utf8');
  console.log('Longitud del archivo:', pageContent.length, 'caracteres');
  
  // Buscar imports importantes
  if (pageContent.includes('getTeacherStudents')) {
    console.log('✅ Importa getTeacherStudents');
  } else {
    console.log('❌ NO importa getTeacherStudents');
  }
  
  if (pageContent.includes('StudentList')) {
    console.log('✅ Importa StudentList');
  } else {
    console.log('❌ NO importa StudentList');
  }
  
  console.log('\nContenido completo:');
  console.log(pageContent);
  
} catch (error) {
  console.error('Error leyendo page.tsx:', error.message);
}

// Verificar contenido del componente StudentList
console.log('\n3. Verificando StudentList component:');
try {
  const listContent = fs.readFileSync(path.join(__dirname, 'src/components/dashboard/teacher/student-list.tsx'), 'utf8');
  console.log('Longitud del archivo:', listContent.length, 'caracteres');
  
  // Buscar elementos clave
  if (listContent.includes('export function StudentList')) {
    console.log('✅ Exporta StudentList correctamente');
  } else if (listContent.includes('export default')) {
    console.log('⚠️ Usa export default en lugar de named export');
  } else {
    console.log('❌ No encuentra export');
  }
  
  if (listContent.includes('"use client"')) {
    console.log('✅ Tiene "use client" directive');
  } else {
    console.log('❌ Falta "use client" directive');
  }
  
} catch (error) {
  console.error('Error leyendo student-list.tsx:', error.message);
}

// Verificar función getTeacherStudents
console.log('\n4. Verificando función getTeacherStudents:');
try {
  const dataContent = fs.readFileSync(path.join(__dirname, 'src/lib/data.ts'), 'utf8');
  
  if (dataContent.includes('export async function getTeacherStudents')) {
    console.log('✅ Función getTeacherStudents exportada');
  } else {
    console.log('❌ Función getTeacherStudents NO encontrada');
  }
  
  // Verificar imports
  if (dataContent.includes('createServerClient')) {
    console.log('✅ Importa createServerClient');
  } else {
    console.log('❌ NO importa createServerClient');
  }
  
} catch (error) {
  console.error('Error leyendo data.ts:', error.message);
}

console.log('\n=== DEBUG COMPLETADO ===');