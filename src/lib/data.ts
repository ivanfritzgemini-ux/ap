import { createServerClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';

export async function getStudentsByHeadTeacher(teacherId: string) {
  noStore();
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc('get_students_by_head_teacher', {
    p_profesor_jefe_id: teacherId
  });

  if (error) {
    console.error('Error fetching students by head teacher:', error);
    return [];
  }

  return data;
}