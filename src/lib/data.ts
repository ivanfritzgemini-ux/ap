import type { User, Student } from './types';
import { createServerClient } from '@/lib/supabase/server';

export async function fetchUsers(): Promise<User[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id,
      rut,
      nombres,
      apellidos,
      email,
      sexo:sexo_id(nombre),
      rol:rol_id(nombre_rol)
    `);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data.map((user) => ({
    id: user.id,
    name: `${user.apellidos || ''} ${user.nombres || ''}`.trim(),
    email: user.email,
    rut: user.rut,
    // @ts-ignore
    gender: user.sexo?.nombre,
    // @ts-ignore
    role: user.rol?.nombre_rol,
  }));
}

export async function getTeacherStudents(): Promise<Student[]> {
  const supabase = await createServerClient();
  
  console.log("🔍 getTeacherStudents: Iniciando función...");
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  console.log("👤 Usuario autenticado:", user ? user.id : "No autenticado");
  if (!user) {
    console.log("❌ No hay usuario autenticado");
    return [];
  }

  // Usar directamente el user.id como profesor_jefe_id (basado en la consulta SQL proporcionada)
  console.log("✅ Usando user.id como profesor ID:", user.id);

  // Usar consulta directa basada en la estructura de la BD
  console.log("🔍 Buscando estudiantes donde es profesor jefe...");
  
  // Primero obtener los cursos donde es profesor jefe
  const { data: cursosJefe, error: cursosError } = await supabase
    .from('cursos')
    .select('id')
    .eq('profesor_jefe_id', user.id);

  console.log("📚 Cursos como profesor jefe:", { 
    count: cursosJefe?.length || 0, 
    error: cursosError,
    cursos: cursosJefe?.map(c => c.id)
  });

  if (cursosError) {
    console.error("❌ Error obteniendo cursos:", cursosError);
    return [];
  }

  if (!cursosJefe || cursosJefe.length === 0) {
    console.log("❌ No es profesor jefe de ningún curso");
    return [];
  }

  // Ahora obtener estudiantes solo de esos cursos
  const cursoIds = cursosJefe.map(c => c.id);
  const { data: estudiantesData, error: estudiantesError } = await supabase
    .from('estudiantes_detalles')
    .select(`
      id,
      nro_registro,
      fecha_matricula,
      fecha_retiro,
      es_matricula_actual,
      curso_id,
      usuarios!estudiante_id (
        rut,
        nombres,
        apellidos,
        sexo:sexo_id(nombre)
      ),
      cursos!curso_id (
        id,
        nivel,
        letra,
        profesor_jefe_id,
        tipo_educacion:tipo_educacion_id(nombre)
      )
    `)
    .in('curso_id', cursoIds);

  console.log("📊 Resultados consulta estudiantes:", { 
    count: estudiantesData?.length || 0, 
    error: estudiantesError,
    teacherId: user.id
  });

  if (estudiantesError) {
    console.error("❌ Error en consulta estudiantes:", estudiantesError);
    return [];
  }

  // Por ahora solo usamos los estudiantes donde es profesor jefe
  // TODO: Agregar estudiantes de asignaturas que imparte
  let asignaturasData: any[] = [];
  let asignaturasError = null;

  // Combinar resultados y eliminar duplicados
  const allData = [...(estudiantesData || []), ...(asignaturasData || [])];
  console.log("📊 Datos combinados:", {
    totalRegistros: allData.length,
    desdeJefe: estudiantesData?.length || 0,
    desdeAsignaturas: asignaturasData?.length || 0
  });

  if (allData.length === 0) {
    console.log("❌ No se encontraron estudiantes en ninguna consulta");
    return [];
  }

  const uniqueStudents = new Map();

  allData.forEach((matricula, index) => {
    console.log(`🔍 Procesando matrícula ${index + 1}:`, {
      id: matricula.id,
      nro_registro: matricula.nro_registro,
      es_matricula_actual: matricula.es_matricula_actual
    });

    const usuario = Array.isArray(matricula.usuarios) ? matricula.usuarios[0] : matricula.usuarios;
    const curso = Array.isArray(matricula.cursos) ? matricula.cursos[0] : matricula.cursos;

    console.log(`📋 Usuario y curso:`, {
      usuario: usuario ? { rut: usuario.rut, nombres: usuario.nombres, apellidos: usuario.apellidos } : null,
      curso: curso ? { id: curso.id, nivel: curso.nivel, letra: curso.letra } : null
    });

    // Solo mantener un registro por estudiante, priorizando la matrícula actual
    const key = `${usuario?.rut}-${curso?.id}`;
    if (!uniqueStudents.has(key) || matricula.es_matricula_actual) {
      const sexoInfo = usuario?.sexo;
      const tipoEducacionInfo = curso?.tipo_educacion;
      
      uniqueStudents.set(key, {
        id: matricula.id,
        registration_number: matricula.nro_registro,
        rut: usuario?.rut ?? 'N/A',
        nombres: usuario?.nombres ?? 'N/A',
        apellidos: usuario?.apellidos ?? 'N/A',
        fecha_retiro: matricula.fecha_retiro,
        es_matricula_actual: matricula.es_matricula_actual,
        sexo: Array.isArray(sexoInfo) ? sexoInfo[0]?.nombre : sexoInfo?.nombre,
        curso: curso ? (() => {
          const tipoEducacion = Array.isArray(tipoEducacionInfo) ? tipoEducacionInfo[0]?.nombre : tipoEducacionInfo?.nombre;
          if (tipoEducacion?.toLowerCase().includes('enseñanza media técnico')) {
            return `${curso.nivel}º Medio TP ${curso.letra}`;
          } else if (tipoEducacion?.toLowerCase().includes('educación media')) {
            return `${curso.nivel}º Medio ${curso.letra}`;
          } else {
            return `${curso.nivel} ${curso.letra}`;
          }
        })() : 'Sin curso',
        enrollment_date: matricula.fecha_matricula
      });
      
      console.log(`✅ Estudiante agregado:`, uniqueStudents.get(key));
    }
  });

  // Convertir a array y aplicar ordenamiento consistente
  const students = Array.from(uniqueStudents.values());
  console.log(`📊 Total estudiantes únicos: ${students.length}`);

  const cutoffDate = new Date('2025-03-03');
  
  students.sort((a, b) => {
    const dateA = a.enrollment_date ? new Date(a.enrollment_date) : null;
    const dateB = b.enrollment_date ? new Date(b.enrollment_date) : null;
    
    const isABeforeCutoff = dateA && dateA <= cutoffDate;
    const isBBeforeCutoff = dateB && dateB <= cutoffDate;
    
    // Ambos matriculados antes o en la fecha límite - ordenar alfabéticamente
    if (isABeforeCutoff && isBBeforeCutoff) {
      const ap = a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' });
      if (ap !== 0) return ap;
      return a.nombres.localeCompare(b.nombres, 'es', { sensitivity: 'base' });
    }
    
    // Ambos matriculados después - ordenar por fecha
    if (!isABeforeCutoff && !isBBeforeCutoff) {
      const da = dateA ? dateA.getTime() : Number.POSITIVE_INFINITY;
      const db = dateB ? dateB.getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    }
    
    // Uno antes y otro después - los anteriores primero
    if (isABeforeCutoff && !isBBeforeCutoff) return -1;
    if (!isABeforeCutoff && isBBeforeCutoff) return 1;
    
    return 0;
  });

  console.log(`✅ Retornando ${students.length} estudiantes ordenados`);
  return students;
}

// Funciones específicas para el dashboard del profesor
export async function getTeacherDashboardData(userId?: string) {
  const supabase = await createServerClient();
  
  // Obtener el usuario actual
  let actualUserId = userId;
  if (!actualUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    actualUserId = user.id;
  }

  console.log("🔍 getTeacherDashboardData: Obteniendo datos del dashboard...");

  try {
    // Obtener cursos donde es profesor jefe
    const { data: cursosJefe, error: cursosError } = await supabase
      .from('cursos')
      .select(`
        id,
        nivel,
        letra,
        tipo_educacion:tipo_educacion_id(nombre)
      `)
      .eq('profesor_jefe_id', actualUserId);

    if (cursosError) {
      console.error("❌ getTeacherDashboardData: Error obteniendo cursos:", cursosError);
      return null;
    }
    
    console.log("📚 Cursos como jefe:", cursosJefe?.length || 0);

    // Obtener estudiantes de sus cursos
    let totalStudents = 0;
    let totalActiveStudents = 0;
    let totalWithdrawnStudents = 0;
    let genderStats = { masculino: 0, femenino: 0 };

    if (cursosJefe && cursosJefe.length > 0) {
      const cursoIds = cursosJefe.map(c => c.id);
      
      const { data: estudiantesData } = await supabase
        .from('estudiantes_detalles')
        .select(`
          id,
          es_matricula_actual,
          fecha_retiro,
          usuarios!estudiante_id (
            sexo:sexo_id(nombre)
          )
        `)
        .in('curso_id', cursoIds);

      if (estudiantesData) {
        totalStudents = estudiantesData.length;
        
        estudiantesData.forEach((estudiante) => {
          const usuario = Array.isArray(estudiante.usuarios) ? estudiante.usuarios[0] : estudiante.usuarios;
          const sexoInfo = usuario?.sexo;
          const sexo = Array.isArray(sexoInfo) ? sexoInfo[0]?.nombre : (sexoInfo as any)?.nombre;

          if (estudiante.es_matricula_actual) {
            totalActiveStudents++;
            if (sexo === 'Masculino') genderStats.masculino++;
            if (sexo === 'Femenino') genderStats.femenino++;
          } else {
            totalWithdrawnStudents++;
          }
        });
      }
    }

    // Obtener asignaturas que imparte (aproximado)
    const { data: asignaturas } = await supabase
      .from('curso_asignatura')
      .select(`
        id,
        asignaturas:asignatura_id(nombre)
      `)
      .eq('profesor_id', actualUserId);

    const totalSubjects = asignaturas?.length || 0;

    // Calcular estadísticas de asistencia (simulada por ahora)
    const attendanceStats = {
      weeklyAverage: 92.5,
      monthlyAverage: 89.3,
      perfectAttendanceStudents: Math.round(totalActiveStudents * 0.15), // 15% aproximado
      latestAttendance: [
        { day: 'Lunes', percentage: 94, present: Math.round(totalActiveStudents * 0.94) },
        { day: 'Martes', percentage: 96, present: Math.round(totalActiveStudents * 0.96) },
        { day: 'Miércoles', percentage: 93, present: Math.round(totalActiveStudents * 0.93) },
        { day: 'Jueves', percentage: 91, present: Math.round(totalActiveStudents * 0.91) },
        { day: 'Viernes', percentage: 87, present: Math.round(totalActiveStudents * 0.87) }
      ]
    };

    return {
      courses: cursosJefe || [],
      totalCourses: cursosJefe?.length || 0,
      totalStudents,
      totalActiveStudents,
      totalWithdrawnStudents,
      totalSubjects,
      genderStats,
      attendanceStats
    };

  } catch (error) {
    console.error("❌ Error en getTeacherDashboardData:", error);
    return null;
  }
}

export async function getStudents(): Promise<Student[]> {
  const supabase = await createServerClient();
  
  // Obtener todas las matrículas (activas y retiradas) para mostrar el historial completo
  const { data, error } = await supabase
    .from('estudiantes_detalles')
    .select(`
      id,
      estudiante_id,
      fecha_retiro,
      motivo_retiro,
      nro_registro,
      fecha_matricula,
      es_matricula_actual,
      usuarios!estudiante_id (
        rut,
        nombres,
        apellidos,
        email,
        sexo:sexo_id(nombre)
      ),
      cursos:curso_id (
        nivel,
        letra,
        tipo_educacion:tipo_educacion_id(nombre)
      )
    `)
    .order('nro_registro', { ascending: true })
    ;


  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  // Agrupar matrículas por estudiante y seleccionar la más relevante
  const estudiantesMap = new Map<string, any[]>();
  
  data.forEach((matricula) => {
    const estudianteId = matricula.estudiante_id;
    if (!estudiantesMap.has(estudianteId)) {
      estudiantesMap.set(estudianteId, []);
    }
    estudiantesMap.get(estudianteId)!.push(matricula);
  });

  return Array.from(estudiantesMap.entries()).map(([estudianteId, matriculas]) => {
    // Priorizar matrícula activa, si no existe tomar la más reciente
    const matriculaActiva = matriculas.find(m => m.es_matricula_actual);
    const matriculaRelevante = matriculaActiva || matriculas.sort((a, b) => 
      new Date(b.fecha_matricula).getTime() - new Date(a.fecha_matricula).getTime()
    )[0];

    // related fields may be returned as arrays (due to PostgREST relation handling)
    const usuariosRel = Array.isArray(matriculaRelevante.usuarios) ? matriculaRelevante.usuarios[0] : matriculaRelevante.usuarios;
    const cursosRel = Array.isArray(matriculaRelevante.cursos) ? matriculaRelevante.cursos[0] : matriculaRelevante.cursos;

    // tipo_educacion may be an array; normalize to string
    const tipoObj = Array.isArray(cursosRel?.tipo_educacion) ? cursosRel.tipo_educacion[0] : cursosRel?.tipo_educacion
    const tipoEducacion = tipoObj?.nombre ?? '';

    // Verificar si el estudiante tiene historial de traslados internos
    const tieneTraslado = matriculas.some(m => 
      m.motivo_retiro && (
        m.motivo_retiro.toLowerCase().includes('traslado') ||
        m.motivo_retiro.toLowerCase().includes('cambio de curso')
      )
    );

    return {
      id: estudianteId,
      // Si no tiene matrícula activa, mostrar datos de retiro de la matrícula más reciente
      fecha_retiro: matriculaActiva ? undefined : matriculaRelevante.fecha_retiro ?? undefined,
      motivo_retiro: matriculaActiva ? undefined : matriculaRelevante.motivo_retiro ?? undefined,
      // Incluir información de traslado para estudiantes activos
      tiene_traslado: tieneTraslado,
      registration_number: matriculaRelevante.nro_registro,
      rut: usuariosRel?.rut ?? 'N/A',
      nombres: usuariosRel?.nombres ?? 'N/A',
      apellidos: usuariosRel?.apellidos ?? 'N/A',
      email: usuariosRel?.email ?? 'N/A',
  // sexo relation may be an array as well
  // @ts-ignore - dynamic relation shape from Supabase
  sexo: (Array.isArray(usuariosRel?.sexo) ? usuariosRel.sexo[0]?.nombre : usuariosRel?.sexo?.nombre) ?? 'N/A',
      curso: cursosRel ? (() => {
        // Aplicar mismo formato que en getCourseDetails
        if (tipoEducacion && tipoEducacion.toLowerCase().includes('enseñanza media técnico')) {
          return `${cursosRel.nivel}º Medio TP ${cursosRel.letra}`;
        } else if (tipoEducacion && tipoEducacion.toLowerCase().includes('educación media')) {
          return `${cursosRel.nivel}º Medio ${cursosRel.letra}`;
        } else {
          return `${cursosRel.nivel} ${cursosRel.letra}`;
        }
      })() : 'Sin curso',
      enrollment_date: matriculaRelevante.fecha_matricula,
    };
  });
}

export async function getCourseDetails(id: string) {
  const supabase = await createServerClient();
  const { data: cursosData, error: cursosErr } = await supabase
    .from('cursos')
    .select(`
      id,
      nivel,
      letra,
      tipo_educacion:tipo_educacion_id(nombre),
      profesor_jefe:profesor_jefe_id(id, usuarios ( id, nombres, apellidos ))
    `)
    .eq('id', id)
    .single();

  if (cursosErr) {
    console.error('Error fetching course details:', cursosErr);
    return null;
  }

  const c = cursosData as any;
  
  // Aplicar formato de nombre según la consulta SQL proporcionada
  let nombre_curso = '';
  const tipoEducacion = Array.isArray(c.tipo_educacion) ? c.tipo_educacion[0]?.nombre : c.tipo_educacion?.nombre;
  
  if (tipoEducacion && tipoEducacion.toLowerCase().includes('enseñanza media técnico')) {
    nombre_curso = `${c.nivel}º Medio TP ${c.letra}`;
  } else if (tipoEducacion && tipoEducacion.toLowerCase().includes('educación media')) {
    nombre_curso = `${c.nivel}º Medio ${c.letra}`;
  } else {
    nombre_curso = `${c.nivel} ${c.letra}`;
  }

  let profesorJefeName: string | null = null;
  // Safer data access
  if (c.profesor_jefe) {
    const profRel = Array.isArray(c.profesor_jefe) ? c.profesor_jefe[0] : c.profesor_jefe;
    if (profRel && profRel.usuarios) {
        const usuario = Array.isArray(profRel.usuarios) ? profRel.usuarios[0] : profRel.usuarios;
        if (usuario) {
            profesorJefeName = `${usuario.apellidos ?? ''} ${usuario.nombres ?? ''}`.trim() || null;
        }
    }
  }

  return {
    id: c.id,
    nombre_curso,
    profesor_jefe: profesorJefeName,
  };
}

export async function getStudentsByCourse(courseId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('estudiantes_detalles')
    .select(`
      id,
      estudiante_id,
      nro_registro,
      fecha_matricula,
      fecha_retiro,
      es_matricula_actual,
      usuarios!estudiante_id (
        nombres,
        apellidos
      )
    `)
    .eq('curso_id', courseId)
    // Mostrar todos los estudiantes que han estado en este curso (activos y retirados) para historial de asistencia
    // Try to order at the DB level by related user fields, then by enrollment date.
    // Note: ordering on related tables may depend on PostgREST/Supabase behavior; we also apply
    // a JS-side stable sort below as a fallback to ensure the required composite ordering.
    .order('apellidos', { foreignTable: 'usuarios', ascending: true })
    .order('nombres', { foreignTable: 'usuarios', ascending: true })
    .order('fecha_matricula', { ascending: true });

  if (error) {
    console.error('Error fetching students for course:', error);
    return [];
  }

  // Normalize and map results, but first apply a JS-side stable sort to guarantee ordering by:
  // 1) apellido asc, 2) nombres asc, 3) fecha_matricula asc. We intentionally do not filter out
  // withdrawn students here (no distinction between retirados/matriculados) as requested.
  const normalized = (data as any[]).map(student => {
    const usuario = Array.isArray(student.usuarios) ? student.usuarios[0] : student.usuarios;
    return {
      raw: student,
      id: student.estudiante_id, // Usar el ID del usuario
      registration_number: student.nro_registro,
      enrollment_date: student.fecha_matricula,
      withdrawal_date: student.fecha_retiro,
      apellido: (usuario?.apellidos ?? '').toString(),
      nombres: (usuario?.nombres ?? '').toString(),
      name: `${usuario?.apellidos ?? ''}, ${usuario?.nombres ?? ''}`.trim(),
    };
  });

  // Custom sort: alphabetical by apellidos for enrollments up to 03/03/2025, then by enrollment date
  const cutoffDate = new Date('2025-03-03');
  
  normalized.sort((a, b) => {
    const dateA = a.enrollment_date ? new Date(a.enrollment_date) : null;
    const dateB = b.enrollment_date ? new Date(b.enrollment_date) : null;
    
    const isABeforeCutoff = dateA && dateA <= cutoffDate;
    const isBBeforeCutoff = dateB && dateB <= cutoffDate;
    
    // Both enrolled before or on cutoff date - sort alphabetically by apellidos, then nombres
    if (isABeforeCutoff && isBBeforeCutoff) {
      const ap = a.apellido.localeCompare(b.apellido, 'es', { sensitivity: 'base' });
      if (ap !== 0) return ap;
      return a.nombres.localeCompare(b.nombres, 'es', { sensitivity: 'base' });
    }
    
    // Both enrolled after cutoff date - sort by enrollment date
    if (!isABeforeCutoff && !isBBeforeCutoff) {
      const da = dateA ? dateA.getTime() : Number.POSITIVE_INFINITY;
      const db = dateB ? dateB.getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    }
    
    // One before cutoff, one after - those before cutoff come first
    if (isABeforeCutoff && !isBBeforeCutoff) return -1;
    if (!isABeforeCutoff && isBBeforeCutoff) return 1;
    
    return 0;
  });

  return normalized.map(item => ({
    id: item.id,
    registration_number: item.registration_number,
    enrollment_date: item.enrollment_date,
    withdrawal_date: item.withdrawal_date,
    name: item.name,
  }));
}

export async function getCourseStatistics(courseId: string) {
  const supabase = await createServerClient();

  try {
    // Obtener todos los estudiantes del curso para hacer el conteo
    const { data: estudiantes, error } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        es_matricula_actual,
        usuarios!estudiante_id (
          id,
          sexo_id,
          rol_id
        )
      `)
      .eq('curso_id', courseId)
      .eq('usuarios.rol_id', 'd27e310f-0e44-4c6a-83fd-a3db125ba142'); // rol estudiante

    if (error) {
      console.error('Error fetching course students:', error);
      return {
        totalActivos: 0,
        totalRetirados: 0,
        totalFemeninos: 0,
        totalMasculinos: 0,
      };
    }

    // Contar estadísticas
    let totalActivos = 0;
    let totalRetirados = 0;
    let totalFemeninos = 0;
    let totalMasculinos = 0;

    estudiantes.forEach((estudiante: any) => {
      const usuario = Array.isArray(estudiante.usuarios) ? estudiante.usuarios[0] : estudiante.usuarios;
      
      if (estudiante.es_matricula_actual) {
        totalActivos++;
        
        // Contar por género solo para estudiantes activos
        if (usuario?.sexo_id === 'a96401ae-e227-4a1d-9978-d87faa1bb2c2') {
          totalFemeninos++;
        } else if (usuario?.sexo_id === 'c871e0f9-ec4e-4039-9287-027340665d1c') {
          totalMasculinos++;
        }
      } else {
        totalRetirados++;
      }
    });

    return {
      totalActivos,
      totalRetirados,
      totalFemeninos,
      totalMasculinos,
    };

  } catch (error) {
    console.error('Error fetching course statistics:', error);
    return {
      totalActivos: 0,
      totalRetirados: 0,
      totalFemeninos: 0,
      totalMasculinos: 0,
    };
  }
}

export interface TeacherSubject {
  id: string;
  nombre: string;
  descripcion?: string;
  nivel?: string;
  cursos: {
    id: string;
    nivel: number;
    letra: string;
    nombre_curso?: string;
    tipo_educacion?: string;
    estudiantes_activos: number;
  }[];
  total_estudiantes: number;
  horario?: {
    dia: string;
    hora_inicio: string;
    hora_fin: string;
  }[];
}

export interface TeacherCourse {
  id: string;
  nombre_curso: string;
  nivel: number;
  letra: string;
  tipo_educacion?: string;
  es_profesor_jefe: boolean;
  asignaturas: {
    id: string;
    nombre: string;
  }[];
  estudiantes_activos: number;
}

export interface StudentGrade {
  student_id: string;
  student_name: string;
  student_rut: string;
  registration_number: string;
  grades: {
    subject_id: string;
    subject_name: string;
    grade_value: number | null;
    grade_type: string;
    evaluation_date?: string;
  }[];
}

export interface AttendanceRecord {
  date: string;
  student_id: string;
  student_name: string;
  student_rut: string;
  registration_number: string;
  status: 'presente' | 'ausente' | 'justificado' | 'tarde';
  justification?: string;
  arrival_time?: string;
}

export interface DayAttendance {
  date: string;
  day_name: string;
  is_school_day: boolean;
  students: AttendanceRecord[];
  summary: {
    total_students: number;
    present: number;
    absent: number;
    justified: number;
    late: number;
    percentage: number;
  };
}

export interface TeacherAttendanceData {
  course: TeacherCourse;
  current_month: string;
  days: DayAttendance[];
  monthly_summary: {
    total_days: number;
    school_days: number;
    average_attendance: number;
    best_day: { date: string; percentage: number } | null;
    worst_day: { date: string; percentage: number } | null;
  };
}

/**
 * Obtiene las asignaturas que imparte un profesor con información de cursos
 */
export async function getTeacherSubjects(): Promise<TeacherSubject[]> {
  const supabase = await createServerClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("❌ getTeacherSubjects: Usuario no autenticado");
    return [];
  }

  console.log("🔍 getTeacherSubjects: Iniciando función para usuario:", user.id);

  try {
    // Obtener asignaturas del profesor con información de cursos
    const { data: asignaturasData, error: asignaturasError } = await supabase
      .from('curso_asignatura')
      .select(`
        id,
        asignaturas:asignatura_id (
          id,
          nombre,
          descripcion
        ),
        cursos:curso_id (
          id,
          nivel,
          letra,
          nombre_curso,
          tipo_educacion_id
        )
      `)
      .eq('profesor_id', user.id);

    if (asignaturasError) {
      console.error("❌ getTeacherSubjects: Error obteniendo asignaturas:", asignaturasError);
      return [];
    }

    if (!asignaturasData || asignaturasData.length === 0) {
      console.log("⚠️ getTeacherSubjects: No se encontraron asignaturas para este profesor");
      return [];
    }

    console.log("📚 getTeacherSubjects: Asignaturas encontradas:", asignaturasData.length);

    // Obtener tipos de educación para el lookup
    const { data: tiposEducacion } = await supabase
      .from('tipo_educacion')
      .select('id, nombre');
    
    const tiposEducacionMap = new Map<number, string>();
    if (tiposEducacion) {
      tiposEducacion.forEach(tipo => {
        tiposEducacionMap.set(tipo.id, tipo.nombre);
      });
    }

    // Agrupar por asignatura y contar estudiantes por curso
    const asignaturasMap = new Map<string, TeacherSubject>();

    for (const item of asignaturasData) {
      const asignatura = Array.isArray(item.asignaturas) 
        ? item.asignaturas[0] 
        : item.asignaturas;
      const curso = Array.isArray(item.cursos) 
        ? item.cursos[0] 
        : item.cursos;

      if (!asignatura || !curso) continue;

      const asignaturaId = asignatura.id;
      
      // Si no existe la asignatura en el map, crearla
      if (!asignaturasMap.has(asignaturaId)) {
        asignaturasMap.set(asignaturaId, {
          id: asignaturaId,
          nombre: asignatura.nombre || 'Sin nombre',
          descripcion: asignatura.descripcion,
          cursos: [],
          total_estudiantes: 0
        });
      }

      // Contar estudiantes activos en este curso
      const { count: estudiantesCount } = await supabase
        .from('estudiantes_detalles')
        .select('id', { count: 'exact', head: true })
        .eq('curso_id', curso.id)
        .eq('es_matricula_actual', true)
        .is('fecha_retiro', null);

      const tipoEducacion = tiposEducacionMap.get(curso.tipo_educacion_id) || 'Sin especificar';

      // Agregar curso a la asignatura
      const asignaturaActual = asignaturasMap.get(asignaturaId)!;
      asignaturaActual.cursos.push({
        id: curso.id,
        nivel: curso.nivel || 0,
        letra: curso.letra || '',
        nombre_curso: curso.nombre_curso || 'Sin nombre',
        tipo_educacion: tipoEducacion,
        estudiantes_activos: estudiantesCount || 0
      });

      asignaturaActual.total_estudiantes += estudiantesCount || 0;
    }

    const resultado = Array.from(asignaturasMap.values())
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    console.log("✅ getTeacherSubjects: Retornando", resultado.length, "asignaturas únicas");
    return resultado;

  } catch (error) {
    console.error("❌ getTeacherSubjects: Error:", error);
    return [];
  }
}

/**
 * Obtiene los cursos donde el profesor puede calificar (como jefe o impartiendo asignaturas)
 */
export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  const supabase = await createServerClient();
  
  // Obtener el usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("❌ getTeacherCourses: Usuario no autenticado");
    return [];
  }

  console.log("🔍 getTeacherCourses: Iniciando función para usuario:", user.id);

  try {
    // Obtener cursos donde es profesor jefe
    const { data: cursosJefe, error: cursosJefeError } = await supabase
      .from('cursos')
      .select(`
        id,
        nivel,
        letra,
        nombre_curso,
        tipo_educacion_id
      `)
      .eq('profesor_jefe_id', user.id);

    if (cursosJefeError) {
      console.error("❌ getTeacherCourses: Error obteniendo cursos como jefe:", cursosJefeError);
    }

    // Obtener cursos donde imparte asignaturas
    const { data: cursosAsignaturas, error: cursosAsignaturasError } = await supabase
      .from('curso_asignatura')
      .select(`
        id,
        asignaturas:asignatura_id (
          id,
          nombre
        ),
        cursos:curso_id (
          id,
          nivel,
          letra,
          nombre_curso,
          tipo_educacion_id
        )
      `)
      .eq('profesor_id', user.id);

    if (cursosAsignaturasError) {
      console.error("❌ getTeacherCourses: Error obteniendo cursos con asignaturas:", cursosAsignaturasError);
    }

    // Obtener tipos de educación
    const { data: tiposEducacion } = await supabase
      .from('tipo_educacion')
      .select('id, nombre');
    
    const tiposEducacionMap = new Map<number, string>();
    if (tiposEducacion) {
      tiposEducacion.forEach(tipo => {
        tiposEducacionMap.set(tipo.id, tipo.nombre);
      });
    }

    // Combinar y procesar cursos
    const cursosMap = new Map<string, TeacherCourse>();

    // Agregar cursos donde es jefe
    if (cursosJefe) {
      for (const curso of cursosJefe) {
        const tipoEducacion = tiposEducacionMap.get(curso.tipo_educacion_id) || 'Sin especificar';
        
        // Contar estudiantes activos
        const { count: estudiantesCount } = await supabase
          .from('estudiantes_detalles')
          .select('id', { count: 'exact', head: true })
          .eq('curso_id', curso.id)
          .eq('es_matricula_actual', true)
          .is('fecha_retiro', null);

        let nombre_curso = '';
        if (tipoEducacion.toLowerCase().includes('enseñanza media técnico')) {
          nombre_curso = `${curso.nivel}º Medio TP ${curso.letra}`;
        } else if (tipoEducacion.toLowerCase().includes('educación media')) {
          nombre_curso = `${curso.nivel}º Medio ${curso.letra}`;
        } else {
          nombre_curso = `${curso.nivel}º ${curso.letra}`;
        }

        cursosMap.set(curso.id, {
          id: curso.id,
          nombre_curso,
          nivel: curso.nivel,
          letra: curso.letra,
          tipo_educacion: tipoEducacion,
          es_profesor_jefe: true,
          asignaturas: [], // Se llenarán con todas las asignaturas del curso
          estudiantes_activos: estudiantesCount || 0
        });
      }
    }

    // Agregar cursos donde imparte asignaturas
    if (cursosAsignaturas) {
      for (const item of cursosAsignaturas) {
        const asignatura = Array.isArray(item.asignaturas) ? item.asignaturas[0] : item.asignaturas;
        const curso = Array.isArray(item.cursos) ? item.cursos[0] : item.cursos;

        if (!asignatura || !curso) continue;

        const tipoEducacion = tiposEducacionMap.get(curso.tipo_educacion_id) || 'Sin especificar';
        
        let nombre_curso = '';
        if (tipoEducacion.toLowerCase().includes('enseñanza media técnico')) {
          nombre_curso = `${curso.nivel}º Medio TP ${curso.letra}`;
        } else if (tipoEducacion.toLowerCase().includes('educación media')) {
          nombre_curso = `${curso.nivel}º Medio ${curso.letra}`;
        } else {
          nombre_curso = `${curso.nivel}º ${curso.letra}`;
        }

        if (!cursosMap.has(curso.id)) {
          // Contar estudiantes activos
          const { count: estudiantesCount } = await supabase
            .from('estudiantes_detalles')
            .select('id', { count: 'exact', head: true })
            .eq('curso_id', curso.id)
            .eq('es_matricula_actual', true)
            .is('fecha_retiro', null);

          cursosMap.set(curso.id, {
            id: curso.id,
            nombre_curso,
            nivel: curso.nivel,
            letra: curso.letra,
            tipo_educacion: tipoEducacion,
            es_profesor_jefe: false,
            asignaturas: [],
            estudiantes_activos: estudiantesCount || 0
          });
        }

        // Agregar asignatura al curso
        const cursoActual = cursosMap.get(curso.id)!;
        if (!cursoActual.asignaturas.find(a => a.id === asignatura.id)) {
          cursoActual.asignaturas.push({
            id: asignatura.id,
            nombre: asignatura.nombre
          });
        }
      }
    }

    const resultado = Array.from(cursosMap.values())
      .sort((a, b) => {
        // Primero por nivel, luego por letra
        if (a.nivel !== b.nivel) return a.nivel - b.nivel;
        return a.letra.localeCompare(b.letra);
      });

    console.log("✅ getTeacherCourses: Retornando", resultado.length, "cursos");
    return resultado;

  } catch (error) {
    console.error("❌ getTeacherCourses: Error:", error);
    return [];
  }
}

/**
 * Obtiene las calificaciones de los estudiantes de un curso específico
 */
export async function getTeacherGrades(courseId: string, subjectId?: string): Promise<StudentGrade[]> {
  const supabase = await createServerClient();
  
  console.log("🔍 getTeacherGrades: Obteniendo calificaciones para curso:", courseId, "asignatura:", subjectId);

  try {
    // Obtener estudiantes del curso
    const { data: estudiantes, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        nro_registro,
        usuarios!estudiante_id (
          id,
          rut,
          nombres,
          apellidos
        )
      `)
      .eq('curso_id', courseId)
      .eq('es_matricula_actual', true)
      .is('fecha_retiro', null);

    if (estudiantesError) {
      console.error("❌ getTeacherGrades: Error obteniendo estudiantes:", estudiantesError);
      return [];
    }

    if (!estudiantes || estudiantes.length === 0) {
      console.log("⚠️ getTeacherGrades: No se encontraron estudiantes activos en el curso");
      return [];
    }

    // Obtener asignaturas del curso (si no se especifica una)
    let asignaturasQuery = supabase
      .from('curso_asignatura')
      .select(`
        asignaturas:asignatura_id (
          id,
          nombre
        )
      `)
      .eq('curso_id', courseId);

    if (subjectId) {
      asignaturasQuery = asignaturasQuery.eq('asignatura_id', subjectId);
    }

    const { data: asignaturas, error: asignaturasError } = await asignaturasQuery;

    if (asignaturasError) {
      console.error("❌ getTeacherGrades: Error obteniendo asignaturas:", asignaturasError);
      return [];
    }

    // Procesar estudiantes
    const resultado: StudentGrade[] = [];

    for (const estudiante of estudiantes) {
      const usuario = Array.isArray(estudiante.usuarios) ? estudiante.usuarios[0] : estudiante.usuarios;
      
      if (!usuario) continue;

      const studentGrade: StudentGrade = {
        student_id: usuario.id,
        student_name: `${usuario.apellidos}, ${usuario.nombres}`,
        student_rut: usuario.rut,
        registration_number: estudiante.nro_registro,
        grades: []
      };

      // Por ahora, solo estructura básica - las calificaciones reales se implementarán según el esquema de BD
      if (asignaturas) {
        for (const item of asignaturas) {
          const asignatura = Array.isArray(item.asignaturas) ? item.asignaturas[0] : item.asignaturas;
          
          if (asignatura) {
            studentGrade.grades.push({
              subject_id: asignatura.id,
              subject_name: asignatura.nombre,
              grade_value: null, // Por implementar según esquema de calificaciones
              grade_type: 'evaluacion', // Por definir tipos de evaluación
              evaluation_date: undefined
            });
          }
        }
      }

      resultado.push(studentGrade);
    }

    // Ordenar alfabéticamente
    resultado.sort((a, b) => a.student_name.localeCompare(b.student_name, 'es', { sensitivity: 'base' }));

    console.log("✅ getTeacherGrades: Retornando", resultado.length, "estudiantes con calificaciones");
    return resultado;

  } catch (error) {
    console.error("❌ getTeacherGrades: Error:", error);
    return [];
  }
}

/**
 * Obtiene los datos de asistencia del mes actual para un curso específico
 */
export async function getTeacherAttendanceData(courseId: string): Promise<TeacherAttendanceData | null> {
  const supabase = await createServerClient();
  
  console.log("🔍 getTeacherAttendanceData: Obteniendo asistencia para curso:", courseId);

  try {
    // Obtener información del curso
    const { data: courseData, error: courseError } = await supabase
      .from('cursos')
      .select(`
        id,
        nivel,
        letra,
        nombre_curso,
        tipo_educacion_id,
        profesor_jefe_id
      `)
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      console.error("❌ getTeacherAttendanceData: Error obteniendo curso:", courseError);
      return null;
    }

    // Obtener tipos de educación
    const { data: tiposEducacion } = await supabase
      .from('tipo_educacion')
      .select('id, nombre');
    
    const tiposEducacionMap = new Map<number, string>();
    if (tiposEducacion) {
      tiposEducacion.forEach(tipo => {
        tiposEducacionMap.set(tipo.id, tipo.nombre);
      });
    }

    const tipoEducacion = tiposEducacionMap.get(courseData.tipo_educacion_id) || 'Sin especificar';

    // Construir nombre del curso
    let nombre_curso = '';
    if (tipoEducacion.toLowerCase().includes('enseñanza media técnico')) {
      nombre_curso = `${courseData.nivel}º Medio TP ${courseData.letra}`;
    } else if (tipoEducacion.toLowerCase().includes('educación media')) {
      nombre_curso = `${courseData.nivel}º Medio ${courseData.letra}`;
    } else {
      nombre_curso = `${courseData.nivel}º ${courseData.letra}`;
    }

    // Obtener usuario actual para verificar si es profesor jefe
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("❌ getTeacherAttendanceData: Usuario no autenticado");
      return null;
    }

    const es_profesor_jefe = courseData.profesor_jefe_id === user.id;

    // Obtener asignaturas que imparte en este curso si no es profesor jefe
    let asignaturas: { id: string; nombre: string; }[] = [];
    if (!es_profesor_jefe) {
      const { data: asignaturasData } = await supabase
        .from('curso_asignatura')
        .select(`
          asignaturas:asignatura_id (
            id,
            nombre
          )
        `)
        .eq('curso_id', courseId)
        .eq('profesor_id', user.id);

      if (asignaturasData) {
        asignaturas = asignaturasData.map(item => {
          const asignatura = Array.isArray(item.asignaturas) ? item.asignaturas[0] : item.asignaturas;
          return {
            id: asignatura.id,
            nombre: asignatura.nombre
          };
        });
      }
    }

    // Contar estudiantes activos
    const { count: estudiantesCount } = await supabase
      .from('estudiantes_detalles')
      .select('id', { count: 'exact', head: true })
      .eq('curso_id', courseId)
      .eq('es_matricula_actual', true)
      .is('fecha_retiro', null);

    // Crear objeto del curso
    const course: TeacherCourse = {
      id: courseData.id,
      nombre_curso,
      nivel: courseData.nivel,
      letra: courseData.letra,
      tipo_educacion: tipoEducacion,
      es_profesor_jefe,
      asignaturas,
      estudiantes_activos: estudiantesCount || 0
    };

    // Obtener fechas del mes actual
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthName = now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    console.log(`📅 getTeacherAttendanceData: Obteniendo asistencia de ${monthName}`);

    // Obtener estudiantes del curso
    const { data: estudiantes, error: estudiantesError } = await supabase
      .from('estudiantes_detalles')
      .select(`
        id,
        nro_registro,
        usuarios!estudiante_id (
          id,
          rut,
          nombres,
          apellidos
        )
      `)
      .eq('curso_id', courseId)
      .eq('es_matricula_actual', true)
      .is('fecha_retiro', null);

    if (estudiantesError || !estudiantes) {
      console.error("❌ getTeacherAttendanceData: Error obteniendo estudiantes:", estudiantesError);
      return null;
    }

    // Generar días del mes
    const days: DayAttendance[] = [];
    let totalSchoolDays = 0;
    let totalAttendancePercentages: number[] = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
      const isSchoolDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a viernes
      
      const dayName = date.toLocaleDateString('es-CL', { weekday: 'long' });

      if (isSchoolDay) {
        totalSchoolDays++;
      }

      // Por ahora, generar datos simulados de asistencia
      // TODO: Reemplazar con consulta real a la tabla de asistencia
      const studentAttendance: AttendanceRecord[] = estudiantes.map((estudiante) => {
        const usuario = Array.isArray(estudiante.usuarios) ? estudiante.usuarios[0] : estudiante.usuarios;
        
        // Simulación básica de asistencia (90% presente en días escolares)
        let status: 'presente' | 'ausente' | 'justificado' | 'tarde' = 'presente';
        if (isSchoolDay) {
          const random = Math.random();
          if (random < 0.05) status = 'ausente';
          else if (random < 0.08) status = 'justificado';
          else if (random < 0.12) status = 'tarde';
        } else {
          status = 'ausente'; // No hay clases en fines de semana
        }

        return {
          date: dateString,
          student_id: usuario.id,
          student_name: `${usuario.apellidos}, ${usuario.nombres}`,
          student_rut: usuario.rut,
          registration_number: estudiante.nro_registro,
          status,
          justification: status === 'justificado' ? 'Certificado médico' : undefined,
          arrival_time: status === 'tarde' ? '08:15' : undefined
        };
      });

      // Calcular resumen del día
      const present = studentAttendance.filter(s => s.status === 'presente').length;
      const absent = studentAttendance.filter(s => s.status === 'ausente').length;
      const justified = studentAttendance.filter(s => s.status === 'justificado').length;
      const late = studentAttendance.filter(s => s.status === 'tarde').length;
      const total = studentAttendance.length;
      const percentage = total > 0 ? ((present + justified + late) / total) * 100 : 0;

      if (isSchoolDay && percentage > 0) {
        totalAttendancePercentages.push(percentage);
      }

      days.push({
        date: dateString,
        day_name: dayName,
        is_school_day: isSchoolDay,
        students: studentAttendance,
        summary: {
          total_students: total,
          present,
          absent,
          justified,
          late,
          percentage: Math.round(percentage * 10) / 10
        }
      });
    }

    // Calcular resumen mensual
    const averageAttendance = totalAttendancePercentages.length > 0 
      ? totalAttendancePercentages.reduce((sum, p) => sum + p, 0) / totalAttendancePercentages.length 
      : 0;

    const schoolDaysWithData = days.filter(d => d.is_school_day && d.summary.percentage > 0);
    const bestDay = schoolDaysWithData.length > 0 
      ? schoolDaysWithData.reduce((best, day) => day.summary.percentage > best.percentage ? day.summary : best, schoolDaysWithData[0].summary)
      : null;
    const worstDay = schoolDaysWithData.length > 0 
      ? schoolDaysWithData.reduce((worst, day) => day.summary.percentage < worst.percentage ? day.summary : worst, schoolDaysWithData[0].summary)
      : null;

    const result: TeacherAttendanceData = {
      course,
      current_month: monthName,
      days,
      monthly_summary: {
        total_days: days.length,
        school_days: totalSchoolDays,
        average_attendance: Math.round(averageAttendance * 10) / 10,
        best_day: bestDay ? { date: bestDay.date, percentage: bestDay.percentage } : null,
        worst_day: worstDay ? { date: worstDay.date, percentage: worstDay.percentage } : null
      }
    };

    console.log("✅ getTeacherAttendanceData: Retornando datos de asistencia");
    return result;

  } catch (error) {
    console.error("❌ getTeacherAttendanceData: Error:", error);
    return null;
  }
}

/**
 * Actualiza el estado de asistencia de un estudiante para una fecha específica
 */
export async function updateStudentAttendance(
  studentId: string,
  courseId: string,
  date: string,
  status: 'presente' | 'ausente' | 'justificado' | 'tarde',
  justification?: string,
  arrivalTime?: string
): Promise<boolean> {
  const supabase = await createServerClient();
  
  console.log(`🔄 updateStudentAttendance: Actualizando asistencia - Estudiante: ${studentId}, Fecha: ${date}, Estado: ${status}`);

  try {
    // Por ahora simulamos la actualización
    // TODO: Implementar actualización real en la tabla de asistencia
    console.log("✅ updateStudentAttendance: Asistencia actualizada (simulado)");
    return true;
    
  } catch (error) {
    console.error("❌ updateStudentAttendance: Error:", error);
    return false;
  }
}
