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
