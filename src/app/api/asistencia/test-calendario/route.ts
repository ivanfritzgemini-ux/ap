import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Test exact dates for days of the week in August 2025
  const testDays = []
  
  // Test first two weeks of August 2025
  for (let day = 1; day <= 15; day++) {
    const date = new Date(2025, 7, day) // Month is 0-indexed in JS, so 7 = August
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
    
    // Map day number to name
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const dayName = dayNames[dayOfWeek]
    
    // Format the date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0]
    
    // Add to our test data
    testDays.push({
      date: formattedDate,
      dayNumber: dayOfWeek,
      dayName: dayName,
      isFriday: dayOfWeek === 5
    })
  }
  
  // Generate test table for the UI
  const calendarTable = generateCalendarTable()
  
  return NextResponse.json({
    message: "Prueba de días de la semana para agosto 2025",
    testDays,
    calendarTable
  })
}

// Generate a visual calendar table for August 2025
function generateCalendarTable() {
  const table = []
  
  // Header row - days of week
  table.push(['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'])
  
  // First day of August 2025 is Friday (day 5)
  const firstDayOfMonth = 5 // 0=Sunday, 5=Friday
  
  let currentDay = 1
  const daysInMonth = 31
  
  // Generate up to 6 rows for the month
  for (let week = 0; week < 6; week++) {
    const weekRow = Array(7).fill('')
    
    // Fill in the days for this week
    for (let weekday = 0; weekday < 7; weekday++) {
      if (week === 0 && weekday < firstDayOfMonth) {
        // Empty cells before the 1st
        weekRow[weekday] = ''
      } else if (currentDay <= daysInMonth) {
        weekRow[weekday] = currentDay.toString()
        currentDay++
      }
    }
    
    // Only add non-empty weeks
    if (weekRow.some(day => day !== '')) {
      table.push(weekRow)
    }
    
    // Stop if we've filled all days
    if (currentDay > daysInMonth) break
  }
  
  return table
}