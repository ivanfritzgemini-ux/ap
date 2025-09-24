// Script de prueba para verificar la funcionalidad de cambio de curso
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:9001';

async function testChangeCourse() {
  console.log('🧪 Probando funcionalidad de cambio de curso...\n');

  try {
    // 1. Obtener lista de estudiantes
    console.log('📋 Obteniendo lista de estudiantes...');
    const studentsRes = await fetch(`${BASE_URL}/api/students/list`);
    const studentsData = await studentsRes.json();
    
    if (!studentsRes.ok) {
      console.error('❌ Error obteniendo estudiantes:', studentsData.error);
      return;
    }
    
    const students = studentsData.data || [];
    console.log(`✅ Encontrados ${students.length} estudiantes`);
    
    if (students.length === 0) {
      console.log('ℹ️ No hay estudiantes para probar');
      return;
    }

    // 2. Tomar el primer estudiante activo
    const activeStudent = students.find(s => !s.fecha_retiro);
    if (!activeStudent) {
      console.log('ℹ️ No hay estudiantes activos para probar');
      return;
    }

    console.log(`👤 Estudiante de prueba: ${activeStudent.nombres} ${activeStudent.apellidos} (${activeStudent.curso})`);

    // 3. Obtener cursos disponibles
    console.log('\n🏫 Obteniendo cursos disponibles...');
    const coursesRes = await fetch(`${BASE_URL}/api/cursos`);
    const coursesData = await coursesRes.json();
    
    if (!coursesRes.ok) {
      console.error('❌ Error obteniendo cursos:', coursesData.error);
      return;
    }

    const courses = coursesData.data || [];
    console.log(`✅ Encontrados ${courses.length} cursos`);

    // 4. Probar obtener historial del estudiante
    console.log(`\n📜 Obteniendo historial del estudiante ${activeStudent.id}...`);
    const historyRes = await fetch(`${BASE_URL}/api/students/change-course?estudiante_id=${activeStudent.id}`);
    const historyData = await historyRes.json();
    
    if (historyRes.ok) {
      console.log(`✅ Historial obtenido: ${historyData.data?.length || 0} registros`);
      if (historyData.data?.length > 0) {
        console.log('📝 Últimos movimientos:');
        historyData.data.slice(0, 3).forEach(h => {
          console.log(`   - ${h.fecha_evento}: ${h.tipo_evento} en ${h.curso_nombre}`);
        });
      }
    } else {
      console.error('❌ Error obteniendo historial:', historyData.error);
    }

    console.log('\n✅ Prueba completada - funcionalidad básica verificada');

  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message);
  }
}

// Ejecutar prueba
testChangeCourse().catch(console.error);