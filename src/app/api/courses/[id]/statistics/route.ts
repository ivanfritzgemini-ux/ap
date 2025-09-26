import { NextRequest, NextResponse } from 'next/server';
import { getCourseStatistics } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const statistics = await getCourseStatistics(params.id);
    
    return NextResponse.json({ data: statistics });
  } catch (error) {
    console.error('Error fetching course statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course statistics' },
      { status: 500 }
    );
  }
}