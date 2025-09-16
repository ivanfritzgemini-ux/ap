import { NextResponse } from 'next/server'
import { getStudents } from '@/lib/data'

export async function GET() {
  try {
    const students = await getStudents()
    return NextResponse.json({ data: students })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
