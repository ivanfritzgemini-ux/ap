import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { parse } from 'papaparse';
import { z } from 'zod';
import { format, parse as dateParse, isValid } from 'date-fns';

// Define the expected CSV row structure with Zod
const StudentCsvRow = z.object({
  rut: z.string().min(1, 'RUT es requerido'),
  nombres: z.string().min(1, 'Nombres son requeridos'),
  apellidos: z.string().min(1, 'Apellidos son requeridos'),
  sexo: z.string().min(1, 'Sexo es requerido'),
  fecha_nacimiento: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  curso: z.string().optional(),
  fecha_matricula: z.string().optional(),
  nro_registro: z.string().min(1, 'Número de registro es requerido'),
});

// Function to parse common date strings (DD/MM/YYYY, YYYY-MM-DD) to ISO format (YYYY-MM-DD)
const parseDate = (dateStr: string | undefined | null): string | null => {
  if (!dateStr || !dateStr.trim()) return null;

  const trimmedDate = dateStr.trim();
  let parsedDate;

  // List of formats to try
  const formats = [
    'd/M/yyyy',
    'dd/MM/yyyy',
    'd-M-yyyy',
    'dd-MM-yyyy',
    'yyyy-MM-dd',
    'yyyy/MM/dd'
  ];

  for (const fmt of formats) {
    parsedDate = dateParse(trimmedDate, fmt, new Date());
    if (isValid(parsedDate)) {
      return format(parsedDate, 'yyyy-MM-dd');
    }
  }
  
  // If no format matches, log an error and return null
  console.error(`Error parsing date: "${dateStr}". None of the expected formats matched.`);
  return null;
};


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();

    let createdCount = 0;
    let failedCount = 0;
    const errors: any[] = [];
    const createdStudents: any[] = [];

    return new Promise((resolve, reject) => {
      parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => {
          const transformed = header.toLowerCase().replace(/\s+/g, '_');
          if (transformed.includes('fecha') && transformed.includes('matricula')) {
            return 'fecha_matricula';
          }
          // Also handle common variations for birth date, just in case
          if (transformed.includes('fecha') && transformed.includes('nacimiento')) {
            return 'fecha_nacimiento';
          }
          // Handle registro variations
          if (transformed.includes('registro') || transformed.includes('nº') || transformed.includes('numero')) {
            return 'nro_registro';
          }
          return transformed;
        },
        complete: async (results) => {
          const supabase = createServiceRoleClient();
          const rows = results.data;

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as any;

            try {
              // Validate row against Zod schema
              const validatedData = StudentCsvRow.parse(row);

              // Find sexo_id from 'sexo' table
              const sexoInput = validatedData.sexo.trim();

              // Map common variations to canonical forms
              const sexoMap: { [key: string]: string } = {
                'f': 'Femenino',
                'femenino': 'Femenino',
                'feme': 'Femenino',
                'fem': 'Femenino',
                'm': 'Masculino',
                'masculino': 'Masculino',
                'masc': 'Masculino',
                'mas': 'Masculino'
              };
              
              let sexoQuery = sexoInput;
              const mappedSexo = sexoMap[sexoInput.toLowerCase()];
              if (mappedSexo) {
                sexoQuery = mappedSexo;
              }

              // Get all available sexo values for better debugging
              const { data: allSexos } = await supabase
                .from('sexo')
                .select('id, nombre');

              // Try exact match first, then case-insensitive match
              let { data: sexoData, error: sexoError } = await supabase
                .from('sexo')
                .select('id')
                .eq('nombre', sexoQuery)
                .single();

              // If exact match fails, try case-insensitive
              if (sexoError || !sexoData) {
                const result = await supabase
                  .from('sexo')
                  .select('id, nombre')
                  .ilike('nombre', `%${sexoQuery}%`);
                
                if (result.data && result.data.length > 0) {
                  sexoData = result.data[0];
                  sexoError = null;
                }
              }

              if (sexoError || !sexoData) {
                const availableSexos = allSexos?.map(s => s.nombre).join(', ') || 'ninguno';
                throw new Error(`Sexo '${validatedData.sexo}' no encontrado. Valores disponibles: ${availableSexos}`);
              }

              // Find curso_id from 'cursos' table
              let cursoId = null;
              if (validatedData.curso) {
                const cursoInput = validatedData.curso.trim();
                let queryBuilder = supabase.from('cursos').select('id');

                // Try to parse nivel and letra from cursoInput
                const match = cursoInput.match(/(\d+)\s*([a-zA-Z])/);
                if (match) {
                  const nivel = parseInt(match[1], 10);
                  const letra = match[2].toUpperCase();
                  queryBuilder = queryBuilder.eq('nivel', nivel).ilike('letra', letra);
                } else {
                  // Fallback to matching nombre_curso if parsing fails
                  queryBuilder = queryBuilder.ilike('nombre_curso', cursoInput);
                }
                
                const { data: cursoData, error: cursoError } = await queryBuilder.single();
                
                if (cursoError || !cursoData) {
                  console.warn(`Curso '${validatedData.curso}' not found, leaving it null.`);
                } else {
                  cursoId = cursoData.id;
                }
              }

              // Check if user already exists
              const { data: existingUser, error: userError } = await supabase
                .from('usuarios')
                .select('id')
                .eq('rut', validatedData.rut)
                .single();

              let userId;
              if (existingUser) {
                userId = existingUser.id;
                // Optionally update user data
                const { error: updateUserError } = await supabase
                  .from('usuarios')
                  .update({
                    nombres: validatedData.nombres,
                    apellidos: validatedData.apellidos,
                    sexo_id: sexoData.id,
                    fecha_nacimiento: parseDate(validatedData.fecha_nacimiento),
                    email: validatedData.email,
                  })
                  .eq('id', userId);
                if (updateUserError) throw updateUserError;

              } else {
                // Create new user
                const { data: newUser, error: newUserError } = await supabase
                  .from('usuarios')
                  .insert({
                    rut: validatedData.rut,
                    nombres: validatedData.nombres,
                    apellidos: validatedData.apellidos,
                    sexo_id: sexoData.id,
                    fecha_nacimiento: parseDate(validatedData.fecha_nacimiento),
                    email: validatedData.email,
                  })
                  .select('id')
                  .single();
                if (newUserError) throw newUserError;
                userId = newUser.id;
              }

              // Check if student record already exists
              const { data: existingStudent, error: studentError } = await supabase
                .from('estudiantes_detalles')
                .select('id')
                .eq('id', userId)
                .single();

              const enrollmentDate = parseDate(validatedData.fecha_matricula);

              if (!cursoId) {
                throw new Error(`Curso '${validatedData.curso}' no encontrado o no válido`);
              }

              if (existingStudent) {
                // Update existing student
                const { error: updateStudentError } = await supabase
                  .from('estudiantes_detalles')
                  .update({
                    curso_id: cursoId,
                    nro_registro: validatedData.nro_registro,
                    fecha_matricula: enrollmentDate,
                  })
                  .eq('id', existingStudent.id);
                
                if (updateStudentError) throw updateStudentError;
                createdCount++;
                createdStudents.push({
                  rut: validatedData.rut,
                  nombre: `${validatedData.nombres} ${validatedData.apellidos}`,
                  status: 'actualizado',
                });

              } else {
                // Create new student
                const { error: newStudentError } = await supabase
                  .from('estudiantes_detalles')
                  .insert({
                    id: userId,
                    curso_id: cursoId,
                    nro_registro: validatedData.nro_registro,
                    fecha_matricula: enrollmentDate,
                  });

                if (newStudentError) throw newStudentError;
                createdCount++;
                createdStudents.push({
                  rut: validatedData.rut,
                  nombre: `${validatedData.nombres} ${validatedData.apellidos}`,
                  status: 'creado',
                });
              }

            } catch (error: any) {
              failedCount++;
              errors.push({
                row: i + 2, // CSV row number (1-based index + header)
                rut: (row as any).rut || 'N/A',
                error: error.message || 'Error desconocido',
              });
            }
          }

          resolve(NextResponse.json({
            success: createdCount,
            failed: failedCount,
            errors: errors,
            created: createdStudents,
          }));
        },
        error: (err: any) => {
          console.error('PapaParse error:', err);
          reject(NextResponse.json({ error: 'Failed to parse CSV file' }, { status: 500 }));
        }
      });
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
