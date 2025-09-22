import { NextResponse } from 'next/server'
import { getStudentsByCourse } from '@/lib/data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const students = await getStudentsByCourse(courseId)
    return NextResponse.json({ data: students })
  } catch (err: any) {
    console.error('Error fetching students by course:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}