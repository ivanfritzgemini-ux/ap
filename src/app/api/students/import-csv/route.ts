import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server';
import { parse } from 'papaparse';
import { z } from 'zod';

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
  fecha_retiro: z.string().optional(),
  motivo_retiro: z.string().optional(),
  nro_registro: z.string().min(1, 'Número de registro es requerido'),
});

// Function to parse common date strings (DD/MM/YYYY, YYYY-MM-DD) to ISO format (YYYY-MM-DD)
const parseDate = (dateStr: string | undefined | null): string | null => {
  if (!dateStr || !dateStr.trim()) return null;

  const trimmedDate = dateStr.trim();
  
  // List of formats to try
  const formats = [
    { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, transform: (m: RegExpMatchArray) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` },
    { pattern: /^(\d{4})-(\d{2})-(\d{2})$/, transform: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` }
  ];

  for (const format of formats) {
    const match = trimmedDate.match(format.pattern);
    if (match) {
      const result = format.transform(match);
      const date = new Date(result);
      if (!isNaN(date.getTime())) {
        return result;
      }
    }
  }
  
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
    
    // Try with regular server client first for reading data
    let supabaseRead;
    try {
      supabaseRead = await createServerClient();
    } catch (e) {
      supabaseRead = createServiceRoleClient();
    }
    
    // Service role client for writes (user creation, etc.)
    const supabase = createServiceRoleClient();

    // Pre-load reference data once to avoid repeated queries
    const [sexosResult, cursosResult] = await Promise.all([
      supabaseRead.from('sexo').select('id, nombre'),
      supabaseRead.from('cursos').select('id, nivel, letra, nombre_curso, tipo_educacion:tipo_educacion_id(nombre)')
    ]);

    const { data: allSexos, error: sexosError } = sexosResult;
    const { data: allCursos, error: cursosError } = cursosResult;
    
    if (sexosError) {
      throw new Error('Error loading sexos data');
    }
    
    if (cursosError) {
      throw new Error('Error loading cursos data');
    }

    // Create lookup maps for better performance
    const sexoLookup = new Map();
    allSexos?.forEach(s => {
      // Trim whitespace from database values
      const trimmedName = s.nombre.trim().toLowerCase();
      sexoLookup.set(trimmedName, s.id);
    });

    const cursoLookup = new Map();
    
    allCursos?.forEach(c => {
      // Create multiple lookup keys for different formats
      const nivel = String(c.nivel || '').trim();
      const letra = String(c.letra || '').trim();
      
      if (nivel && letra) {
        // Standard format: "1a", "2b", etc.
        const standardKey = `${nivel}${letra}`.toLowerCase();
        cursoLookup.set(standardKey, c.id);
        
        // With space: "1 a", "2 b", etc.
        const spaceKey = `${nivel} ${letra}`.toLowerCase();
        cursoLookup.set(spaceKey, c.id);
        
        // With degree symbol: "1°a", "2°b", etc.
        const degreeKey = `${nivel}°${letra}`.toLowerCase();
        cursoLookup.set(degreeKey, c.id);
        
        // With degree and space: "1° a", "2° b", etc.
        const degreeSpaceKey = `${nivel}° ${letra}`.toLowerCase();
        cursoLookup.set(degreeSpaceKey, c.id);
      }
      
      // Also map by full course name if available
      if (c.nombre_curso) {
        cursoLookup.set(c.nombre_curso.trim().toLowerCase(), c.id);
      }
      
      // Map by combined description if tipo_educacion exists
      const tipoEducacion = Array.isArray(c.tipo_educacion) ? c.tipo_educacion[0] : c.tipo_educacion;
      if (tipoEducacion?.nombre && nivel && letra) {
        const tipoNombre = tipoEducacion.nombre.toLowerCase();
        const combinedKey = `${nivel} ${tipoNombre} ${letra}`.toLowerCase();
        cursoLookup.set(combinedKey, c.id);
        
        // Also try shortened version
        if (tipoNombre.includes('media')) {
          const shortKey = `${nivel} medio ${letra}`.toLowerCase();
          cursoLookup.set(shortKey, c.id);
        }
      }
    });

    // Create dynamic sex mapping based on actual database values
    const sexoMap: { [key: string]: string } = {};
    
    // Add database values (normalized to lowercase and trimmed)
    allSexos?.forEach(s => {
      const trimmedName = s.nombre.trim();
      const normalizedName = trimmedName.toLowerCase();
      
      // Map normalized version to itself
      sexoMap[normalizedName] = normalizedName;
      // Map original case to normalized
      sexoMap[trimmedName] = normalizedName;
      // Map original case lowercase to normalized
      sexoMap[trimmedName.toLowerCase()] = normalizedName;
    });
    
    // Add common variations and map them to the actual database values
    const sexoVariations: { [key: string]: string[] } = {
      'femenino': ['f', 'fem', 'feme', 'mujer', 'female'],
      'masculino': ['m', 'mas', 'masc', 'hombre', 'male'],
      'otro': ['other', 'x', 'no binario', 'nb']
    };

    // Map variations to actual database values
    Object.entries(sexoVariations).forEach(([dbValue, variations]) => {
      const actualDbValue = allSexos?.find(s => s.nombre.trim().toLowerCase() === dbValue);
      if (actualDbValue) {
        const normalizedDbValue = actualDbValue.nombre.trim().toLowerCase();
        variations.forEach(variation => {
          sexoMap[variation] = normalizedDbValue;
        });
      }
    });

    return new Promise((resolve) => {
      let createdCount = 0;
      let failedCount = 0;
      const errors: any[] = [];
      const createdStudents: any[] = [];

      parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => {
          const transformed = header.toLowerCase().replace(/\s+/g, '_');
          if (transformed.includes('fecha') && transformed.includes('matricula')) {
            return 'fecha_matricula';
          }
          if (transformed.includes('fecha') && transformed.includes('nacimiento')) {
            return 'fecha_nacimiento';
          }
          if (transformed.includes('fecha') && transformed.includes('retiro')) {
            return 'fecha_retiro';
          }
          if (transformed.includes('motivo') && transformed.includes('retiro')) {
            return 'motivo_retiro';
          }
          if (transformed.includes('registro') || transformed.includes('nº') || transformed.includes('numero')) {
            return 'nro_registro';
          }
          return transformed;
        },
        complete: async (results) => {
          const rows = results.data;

          // Process rows sequentially to avoid race conditions
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i] as any;
            
            try {
              // Validate row against Zod schema
              const validatedData = StudentCsvRow.parse(row);

              // Find sexo_id using pre-loaded data
              const sexoInput = validatedData.sexo.trim().toLowerCase();
              
              // Try multiple approaches to find the sexo
              let sexoId = null;
              
              // First, try direct lookup with the normalized input
              sexoId = sexoLookup.get(sexoInput);
              
              // If not found, try through the mapping
              if (!sexoId) {
                const mappedSexo = sexoMap[sexoInput];
                if (mappedSexo) {
                  sexoId = sexoLookup.get(mappedSexo);
                }
              }
              
              // If still not found, try with original case
              if (!sexoId) {
                const originalCase = validatedData.sexo.trim();
                sexoId = sexoLookup.get(originalCase.toLowerCase());
              }

              if (!sexoId) {
                const availableSexos = allSexos?.map(s => `'${s.nombre.trim()}'`).join(', ') || 'ninguno';
                const mappingKeys = Object.keys(sexoMap).join(', ');
                throw new Error(`Sexo '${validatedData.sexo}' no encontrado. Input normalizado: '${sexoInput}'. Valores disponibles: ${availableSexos}. Mapeos: ${mappingKeys}`);
              }

              // Find curso_id using pre-loaded data
              let cursoId = null;
              if (validatedData.curso) {
                const cursoInput = validatedData.curso.trim().toLowerCase();
                
                // Try multiple lookup strategies
                
                // 1. Direct lookup
                cursoId = cursoLookup.get(cursoInput);
                
                // 2. Try parsing nivel and letra patterns
                if (!cursoId) {
                  const patterns = [
                    /(\d+)\s*([a-zA-Z])/,           // "1a", "1 a"
                    /(\d+)°?\s*([a-zA-Z])/,        // "1°a", "1° a"
                    /(\d+)\s*(medio|media|básico|básica)\s*([a-zA-Z])/i  // "1 medio a"
                  ];
                  
                  for (const pattern of patterns) {
                    const match = cursoInput.match(pattern);
                    if (match) {
                      let nivel, letra;
                      if (match[3]) {
                        // Pattern with medio/básico
                        nivel = match[1];
                        letra = match[3];
                      } else {
                        // Simple pattern
                        nivel = match[1];
                        letra = match[2];
                      }
                      
                      // Try different key combinations
                      const keys = [
                        `${nivel}${letra}`,
                        `${nivel} ${letra}`,
                        `${nivel}°${letra}`,
                        `${nivel}° ${letra}`
                      ];
                      
                      for (const key of keys) {
                        cursoId = cursoLookup.get(key);
                        if (cursoId) break;
                      }
                      
                      if (cursoId) break;
                    }
                  }
                }
                
                if (!cursoId) {
                  // Course not found, will be set to null
                }
              }

              // Check if user already exists
              const { data: existingUser } = await supabase
                .from('usuarios')
                .select('id')
                .eq('rut', validatedData.rut)
                .single();

              let userId;
              if (existingUser) {
                userId = existingUser.id;
                
                // Update user data if different
                await supabase
                  .from('usuarios')
                  .update({
                    nombres: validatedData.nombres,
                    apellidos: validatedData.apellidos,
                    sexo_id: sexoId,
                    fecha_nacimiento: parseDate(validatedData.fecha_nacimiento),
                    email: validatedData.email,
                  })
                  .eq('id', userId);

              } else {
                // Create new auth user first
                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                  email: validatedData.email || `${validatedData.rut}@importado.local`,
                  password: String(validatedData.rut),
                  user_metadata: { nombres: validatedData.nombres, apellidos: validatedData.apellidos }
                });
                
                if (authError) {
                  // If email already exists, try to find the existing user
                  if (authError.message && authError.message.includes('already been registered')) {
                    const { data: listRes, error: listErr } = await supabase.auth.admin.listUsers({ 
                      query: validatedData.email 
                    } as any);
                    if (listErr) throw new Error(`Error buscando usuario existente: ${listErr.message}`);
                    const found = listRes?.users?.find((u: any) => u.email === validatedData.email);
                    if (!found) throw new Error('No se pudo encontrar el usuario existente por email');
                    userId = found.id;
                  } else {
                    throw new Error(`Error al crear usuario auth: ${authError.message}`);
                  }
                } else {
                  userId = authUser.user?.id;
                  if (!userId) throw new Error('No se pudo obtener el ID del usuario creado');
                }

                // Create user in usuarios table
                await supabase
                  .from('usuarios')
                  .insert({
                    id: userId,
                    rut: validatedData.rut,
                    nombres: validatedData.nombres,
                    apellidos: validatedData.apellidos,
                    sexo_id: sexoId,
                    fecha_nacimiento: parseDate(validatedData.fecha_nacimiento),
                    email: validatedData.email,
                    rol_id: 'd27e310f-0e44-4c6a-83fd-a3db125ba142' // Rol estudiante por defecto
                  });
              }

              // Check if student record already exists
              const { data: existingStudent } = await supabase
                .from('estudiantes_detalles')
                .select('id')
                .eq('id', userId)
                .single();

              const enrollmentDate = parseDate(validatedData.fecha_matricula);
              const retirementDate = parseDate(validatedData.fecha_retiro);

              if (existingStudent) {
                // Update existing student
                await supabase
                  .from('estudiantes_detalles')
                  .update({
                    curso_id: cursoId,
                    nro_registro: validatedData.nro_registro,
                    fecha_matricula: enrollmentDate,
                    fecha_retiro: retirementDate,
                    motivo_retiro: validatedData.motivo_retiro || null,
                  })
                  .eq('id', existingStudent.id);
                
                createdCount++;
                createdStudents.push({
                  rut: validatedData.rut,
                  nombre: `${validatedData.nombres} ${validatedData.apellidos}`,
                  status: 'actualizado',
                });

              } else {
                // Create new student
                await supabase
                  .from('estudiantes_detalles')
                  .insert({
                    id: userId,
                    curso_id: cursoId,
                    nro_registro: validatedData.nro_registro,
                    fecha_matricula: enrollmentDate,
                    fecha_retiro: retirementDate,
                    motivo_retiro: validatedData.motivo_retiro || null,
                  });

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
          resolve(NextResponse.json({ error: 'Failed to parse CSV file' }, { status: 500 }));
        }
      });
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}