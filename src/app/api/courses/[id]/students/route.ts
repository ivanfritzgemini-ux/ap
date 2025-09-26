import { NextRequest, NextResponse } from 'next/server';
import { getStudentsByCourse } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const students = await getStudentsByCourse(params.id);
    
    return NextResponse.json({ data: students });
  } catch (error) {
    console.error('Error fetching students by course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}