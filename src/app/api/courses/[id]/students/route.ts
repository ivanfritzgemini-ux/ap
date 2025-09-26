import { NextRequest, NextResponse } from 'next/server';
import { getStudentsByCourse } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const students = await getStudentsByCourse(id);
    
    return NextResponse.json({ data: students });
  } catch (error) {
    console.error('Error fetching students by course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}