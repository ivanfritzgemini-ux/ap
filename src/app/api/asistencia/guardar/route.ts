import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { asistencias } = body // Array de objetos { estudiante_id, fecha, presente }

    if (!asistencias || !Array.isArray(asistencias)) {
      return NextResponse.json({ 
        error: 'Se requiere un array de asistencias' 
      }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    
    // Agrupar por curso_id (todos deben ser del mismo curso)
    const cursoId = asistencias[0]?.curso_id
    if (!cursoId) {
      return NextResponse.json({ 
        error: 'curso_id es requerido' 
      }, { status: 400 })
    }

    const resultados = []
    const errores = []
    const registrosExitosos = [] // Nuevo: seguimiento de registros guardados exitosamente
    const registrosFallidos = [] // Nuevo: seguimiento de registros que fallaron

    console.log(`Procesando ${asistencias.length} registros de asistencia para el curso ${cursoId}...`);
    
    // Preparar todos los registros para UPSERT en lotes
    const registrosParaUpsert = asistencias
      .filter(asistencia => {
        const { estudiante_id, fecha, curso_id, presente } = asistencia;
        if (!estudiante_id || !fecha || curso_id !== cursoId || typeof presente !== 'boolean') {
          // Mejorado: añadir información más específica
          errores.push({
            asistencia,
            error: 'Datos incompletos, presente no es booleano o curso_id inconsistente',
            tipo: 'validacion',
            fecha: asistencia.fecha || 'desconocida'
          });
          registrosFallidos.push({
            estudiante_id: asistencia.estudiante_id || 'desconocido',
            fecha: asistencia.fecha || 'desconocida',
            razon: 'Validación fallida (presente no es booleano)'
          });
          return false;
        }
        return true;
      })
      .map(asistencia => {
        const { estudiante_id, curso_id, fecha, presente } = asistencia;
        return {
          estudiante_id,
          curso_id,
          fecha,
          presente: presente,
          justificado: false,
          tipo_ausencia: presente ? null : 'injustificada',
          updated_at: new Date().toISOString()
        };
      });
    
    // Optimizar el tamaño de lote según la cantidad de registros
    // Para cursos grandes (30 alumnos) con un mes completo (~600 registros)
    const BATCH_SIZE = 50; // Tamaño óptimo para evitar errores de conexión pero mantener velocidad
    const MAX_RETRIES = 3; // Número máximo de reintentos para lotes fallidos
    
    // Agrupar los registros por día en lugar de por semana para mayor precisión
    const registrosPorDia: Record<string, any[]> = {};
    registrosParaUpsert.forEach(registro => {
      const fecha = registro.fecha.split('T')[0]; // YYYY-MM-DD
      if (!registrosPorDia[fecha]) {
        registrosPorDia[fecha] = [];
      }
      registrosPorDia[fecha].push(registro);
    });
    
    // Procesar por día y luego por lotes
    for (const [fecha, registrosDia] of Object.entries(registrosPorDia)) {
      console.log(`Procesando día ${fecha} con ${registrosDia.length} registros...`);
      
      // Procesar en lotes dentro de cada día
      for (let i = 0; i < registrosDia.length; i += BATCH_SIZE) {
        const batch = registrosDia.slice(i, i + BATCH_SIZE);
        let procesado = false;
        let intentos = 0;
        
        // Intentar hasta MAX_RETRIES veces
        while (!procesado && intentos < MAX_RETRIES) {
          try {
            intentos++;
            
            // Usar UPSERT con el constraint correcto (solo estudiante_id y fecha)
            const { data, error } = await supabase
              .from('asistencia')
              .upsert(batch, {
                onConflict: 'estudiante_id,fecha'
              });
            
            if (error) {
              console.error(`Error en lote (fecha ${fecha}, intento ${intentos}):`, error);
              if (intentos === MAX_RETRIES) {
                // Mejorado: guardar información específica del lote que falló
                errores.push({
                  fecha,
                  lote: Math.floor(i / BATCH_SIZE) + 1,
                  registros: batch.length,
                  error: error.message,
                  detalles: batch.map(reg => ({ 
                    estudiante_id: reg.estudiante_id,
                    fecha: reg.fecha
                  }))
                });
                
                // Registrar cada registro fallido individualmente
                batch.forEach(reg => {
                  registrosFallidos.push({
                    estudiante_id: reg.estudiante_id,
                    fecha: reg.fecha,
                    razon: error.message
                  });
                });
              }
              // Esperar un poco antes de reintentar (backoff exponencial)
              await new Promise(resolve => setTimeout(resolve, 500 * intentos));
            } else {
              procesado = true;
              resultados.push({
                fecha,
                lote: Math.floor(i / BATCH_SIZE) + 1,
                registros: batch.length
              });
              
              // Registrar cada registro exitoso
              batch.forEach(reg => {
                registrosExitosos.push({
                  estudiante_id: reg.estudiante_id,
                  fecha: reg.fecha
                });
              });
            }
          } catch (err: any) {
            console.error(`Error procesando lote (fecha ${fecha}, intento ${intentos}):`, err);
            if (intentos === MAX_RETRIES) {
              // Mejorado: guardar información específica del lote que falló con excepción
              errores.push({
                fecha,
                lote: Math.floor(i / BATCH_SIZE) + 1,
                registros: batch.length,
                error: err.message,
                tipo: 'excepcion',
                detalles: batch.map(reg => ({ 
                  estudiante_id: reg.estudiante_id,
                  fecha: reg.fecha
                }))
              });
              
              // Registrar cada registro fallido individualmente
              batch.forEach(reg => {
                registrosFallidos.push({
                  estudiante_id: reg.estudiante_id,
                  fecha: reg.fecha,
                  razon: err.message
                });
              });
            }
            // Esperar un poco antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 500 * intentos));
          }
        }
      }
    }
    
    // Agrupar registros fallidos por fecha para facilitar el diagnóstico
    const fallidosPorFecha = registrosFallidos.reduce((acc, registro) => {
      const fecha = registro.fecha.split('T')[0];
      if (!acc[fecha]) acc[fecha] = [];
      acc[fecha].push(registro);
      return acc;
    }, {});
    
    // Calcular estadísticas por fecha
    const estadisticasPorFecha = {};
    for (const [fecha, registros] of Object.entries(registrosPorDia)) {
      const exitosos = registrosExitosos.filter(r => r.fecha.startsWith(fecha)).length;
      const fallidos = registrosFallidos.filter(r => r.fecha.startsWith(fecha)).length;
      estadisticasPorFecha[fecha] = {
        total: registros.length,
        exitosos,
        fallidos,
        porcentaje: Math.round((exitosos / registros.length) * 100)
      };
    }
    
    console.log(`Procesamiento completado. Éxitos: ${registrosExitosos.length} registros, Errores: ${registrosFallidos.length} registros`);

    return NextResponse.json({
      success: registrosFallidos.length === 0,
      message: `Procesados ${registrosExitosos.length} registros de asistencia con éxito. ${registrosFallidos.length} registros fallidos.`,
      total_enviados: registrosParaUpsert.length,
      total_exitosos: registrosExitosos.length,
      total_fallidos: registrosFallidos.length,
      resultados: resultados.length,
      errores: errores.length,
      detalles_errores: errores,
      registros_fallidos: registrosFallidos,
      fallidos_por_fecha: fallidosPorFecha,
      estadisticas_por_fecha: estadisticasPorFecha
    })

  } catch (err: any) {
    console.error('Error en POST /api/asistencia/guardar:', err)
    return NextResponse.json({ 
      error: err.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}