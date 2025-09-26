// Test script to verify the gender statistics API endpoint
const BASE_URL = 'http://localhost:9001'

async function testGenderStatsAPI() {
  try {
    console.log('🧪 Testing Students by Course with Gender Statistics API...\n')
    
    const response = await fetch(`${BASE_URL}/api/dashboard/students-by-course`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    console.log('✅ API Response received successfully!')
    console.log(`📊 Found ${data.length} courses\n`)
    
    // Display results
    data.forEach((course, index) => {
      console.log(`${index + 1}. Curso: ${course.curso}`)
      console.log(`   📚 Total estudiantes: ${course.estudiantes}`)
      console.log(`   👨 Masculinos: ${course.masculinos}`)
      console.log(`   👩 Femeninas: ${course.femeninos}`)
      console.log(`   🆔 ID del curso: ${course.cursoId}`)
      
      // Validation
      const total = course.masculinos + course.femeninos
      if (total <= course.estudiantes) {
        console.log(`   ✅ Suma correcta: ${course.masculinos} + ${course.femeninos} = ${total} ≤ ${course.estudiantes}`)
      } else {
        console.log(`   ❌ Error en suma: ${course.masculinos} + ${course.femeninos} = ${total} > ${course.estudiantes}`)
      }
      console.log('')
    })
    
    // Summary statistics
    const totals = data.reduce((acc, course) => ({
      estudiantes: acc.estudiantes + course.estudiantes,
      masculinos: acc.masculinos + course.masculinos,
      femeninos: acc.femeninos + course.femeninos
    }), { estudiantes: 0, masculinos: 0, femeninos: 0 })
    
    console.log('📈 Estadísticas Totales:')
    console.log(`   Total estudiantes: ${totals.estudiantes}`)
    console.log(`   Total masculinos: ${totals.masculinos}`)
    console.log(`   Total femeninas: ${totals.femeninos}`)
    console.log(`   Porcentaje masculino: ${totals.estudiantes > 0 ? ((totals.masculinos / totals.estudiantes) * 100).toFixed(1) : 0}%`)
    console.log(`   Porcentaje femenino: ${totals.estudiantes > 0 ? ((totals.femeninos / totals.estudiantes) * 100).toFixed(1) : 0}%`)
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message)
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Sugerencias:')
      console.log('   1. Asegúrate de que el servidor esté ejecutándose en http://localhost:3000')
      console.log('   2. Ejecuta: npm run dev')
      console.log('   3. Verifica que la base de datos esté conectada')
    }
  }
}

// Run the test
testGenderStatsAPI()