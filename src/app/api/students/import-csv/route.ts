import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { parse } from 'papaparse'

// Define la estructura esperada del CSV
interface CsvStudent {
  rut: string;
  nombres: string;
  apellidos: string;
  sexo: string;  // puede ser nombre o id de sexo
  fecha_nacimiento: string;  // formato YYYY-MM-DD
  email?: string;
  telefono?: string;
  direccion?: string;
  curso?: string;  // puede ser nombre o id de curso
  nro_registro?: string;
  fecha_matricula?: string;  // formato YYYY-MM-DD
}

// Función auxiliar para validar fecha
const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  // Validar formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  
  try {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }
    
    // Verificar que sea un archivo CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'El archivo debe tener formato CSV' }, { status: 400 });
    }

    // Leer el contenido del archivo
    const text = await file.text();
    
    // Parsear CSV con papaparse
    const { data, errors } = parse(text, {
      header: true,
      skipEmptyLines: true
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Error al parsear el archivo CSV', details: errors },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const adminClient = createServiceRoleClient();

    // Obtener referencia a sexos y cursos para la validación
    const [{ data: sexos }, { data: cursos }] = await Promise.all([
      supabase.from('sexo').select('id, nombre'),
      supabase.from('cursos').select('id, nivel, letra, tipo_educacion(nombre)')
    ]);
    
    // Mapeo de nombres de sexo a IDs
    const sexoMap = new Map();
    if (sexos) {
      sexos.forEach((s: any) => {
        sexoMap.set(s.nombre.toLowerCase(), s.id);
      });
    }

    // Mapeo de nombres de curso a IDs
    const cursoMap = new Map();
    if (cursos) {
      cursos.forEach((c: any) => {
        // Crear un texto descriptivo del curso para buscar coincidencias
        const nivel = c.nivel || '';
        const letra = c.letra || '';
        const tipoNombre = c.tipo_educacion?.nombre || '';
        let tipoLabel = tipoNombre;
        if (typeof tipoLabel === 'string' && tipoLabel.includes('Media')) {
          tipoLabel = 'Medio';
        }

        let cursoLabel = '';
        if (nivel && tipoLabel && letra) {
          cursoLabel = `${nivel}º ${tipoLabel} ${letra}`;
        } else if (nivel && letra) {
          cursoLabel = `${nivel}º ${letra}`;
        }

        // Guardar varias formas de referirse al mismo curso
        if (cursoLabel) {
          cursoMap.set(cursoLabel.toLowerCase(), c.id);
          cursoMap.set(`${nivel}${letra}`.toLowerCase(), c.id);
        }
      });
    }

    // Resultados de procesamiento
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
      created: [] as any[]
    };

    // Procesar cada estudiante
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i] as any;
        // Crear objeto estudiante con las claves normalizadas
        const student: Record<string, any> = {};
        
        // Mapear y normalizar campos
        Object.keys(row).forEach(key => {
          const normalizedKey = key.trim().toLowerCase();
          let value = row[key];
          
          // Convertir claves del CSV a las claves del sistema
          switch (normalizedKey) {
            case 'rut':
            case 'nombres':
            case 'apellidos':
            case 'email':
            case 'telefono':
            case 'direccion':
              student[normalizedKey] = value;
              break;
            case 'nombre':
              student['nombres'] = value;
              break;
            case 'apellido':
              student['apellidos'] = value;
              break;
            case 'fecha_nacimiento':
            case 'fecha_nac':
            case 'nacimiento':
              student['fecha_nacimiento'] = value;
              break;
            case 'sexo':
            case 'genero':
              // Intentar encontrar el ID del sexo
              const sexoKey = String(value).toLowerCase();
              student['sexo_id'] = sexoMap.get(sexoKey) || value;
              break;
            case 'curso':
            case 'clase':
              // Intentar encontrar el ID del curso
              const cursoKey = String(value).toLowerCase();
              student['curso_id'] = cursoMap.get(cursoKey) || value;
              break;
            case 'nro_registro':
            case 'registro':
            case 'num_registro':
              student['nro_registro'] = value;
              break;
            case 'fecha_matricula':
            case 'matricula':
              student['fecha_matricula'] = value;
              break;
          }
        });
        
        // Validaciones básicas
        if (!student.rut) throw new Error('RUT es obligatorio');
        if (!student.nombres) throw new Error('Nombres es obligatorio');
        if (!student.apellidos) throw new Error('Apellidos es obligatorio');
        
        // Validar fecha de nacimiento si existe
        if (student.fecha_nacimiento && !isValidDate(student.fecha_nacimiento)) {
          throw new Error('Formato de fecha de nacimiento inválido. Use YYYY-MM-DD');
        }

        // Validar fecha de matrícula si existe
        if (student.fecha_matricula && !isValidDate(student.fecha_matricula)) {
          throw new Error('Formato de fecha de matrícula inválido. Use YYYY-MM-DD');
        }

        // Si no hay fecha de matrícula, usar la fecha actual
        if (!student.fecha_matricula) {
          const today = new Date();
          student.fecha_matricula = today.toISOString().split('T')[0];
        }
        
        // Verificar si el RUT ya existe
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('id, rut')
          .eq('rut', student.rut)
          .single();
        
        let userId;
        
        if (existingUser) {
          // Si el usuario ya existe, usamos su ID
          userId = existingUser.id;
          
          // Actualizar información del usuario
          await supabase
            .from('usuarios')
            .update({
              nombres: student.nombres,
              apellidos: student.apellidos,
              sexo_id: student.sexo_id,
              email: student.email,
              telefono: student.telefono,
              direccion: student.direccion,
              fecha_nacimiento: student.fecha_nacimiento
            })
            .eq('id', userId);
        } else {
          // Crear nuevo usuario en auth
          const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email: student.email || `${student.rut}@importado.local`,
            password: String(student.rut),
            user_metadata: { nombres: student.nombres, apellidos: student.apellidos }
          });
          
          if (authError) throw new Error(`Error al crear usuario: ${authError.message}`);
          
          userId = authUser.user?.id;
          if (!userId) throw new Error('No se pudo crear el usuario');
          
          // Insertar en usuarios
          const { error: userError } = await supabase
            .from('usuarios')
            .insert({
              id: userId,
              rut: student.rut,
              nombres: student.nombres,
              apellidos: student.apellidos,
              sexo_id: student.sexo_id,
              email: student.email,
              telefono: student.telefono,
              direccion: student.direccion,
              fecha_nacimiento: student.fecha_nacimiento,
              rol_id: '7248dcb6-82c5-4511-abf6-1a4f7f99a847' // Rol estudiante por defecto
            });
          
          if (userError) throw new Error(`Error al crear usuario: ${userError.message}`);
        }
        
        // Verificar si el estudiante ya existe
        const { data: existingStudent } = await supabase
          .from('estudiantes')
          .select('id')
          .eq('usuario_id', userId)
          .single();
        
        if (existingStudent) {
          // Actualizar estudiante existente
          const { error: updateError } = await supabase
            .from('estudiantes')
            .update({
              curso_id: student.curso_id,
              nro_registro: student.nro_registro,
              fecha_matricula: student.fecha_matricula
            })
            .eq('id', existingStudent.id);
          
          if (updateError) throw new Error(`Error al actualizar estudiante: ${updateError.message}`);
          
          results.success++;
          results.created.push({
            rut: student.rut,
            nombre: `${student.apellidos} ${student.nombres}`,
            status: 'actualizado'
          });
        } else {
          // Crear nuevo estudiante
          const { error: studentError } = await supabase
            .from('estudiantes')
            .insert({
              usuario_id: userId,
              curso_id: student.curso_id,
              nro_registro: student.nro_registro,
              fecha_matricula: student.fecha_matricula
            });
          
          if (studentError) throw new Error(`Error al crear estudiante: ${studentError.message}`);
          
          results.success++;
          results.created.push({
            rut: student.rut,
            nombre: `${student.apellidos} ${student.nombres}`,
            status: 'creado'
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 2, // +2 para considerar el encabezado y el índice base 0
          rut: (data[i] as any).rut || 'N/A',
          error: error.message || 'Error desconocido'
        });
      }
    }
    
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('Error al importar estudiantes:', error);
    return NextResponse.json(
      { error: error.message || 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}