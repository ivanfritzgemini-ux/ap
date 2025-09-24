import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // Obtener parámetros de consulta
  const url = new URL(request.url);
  const cursoId = url.searchParams.get('cursoId');
  const mes = url.searchParams.get('mes');
  const año = url.searchParams.get('año');
  
  if (!cursoId || !mes || !año) {
    return NextResponse.json({ 
      error: 'Se requiere cursoId, mes y año'
    }, { status: 400 });
  }
  
  try {
    const supabase = createServiceRoleClient();
    
    // Obtener el primer y último día del mes
    const primerDia = `${año}-${mes.padStart(2, '0')}-01`;
    const ultimoDia = new Date(parseInt(año), parseInt(mes), 0).toISOString().split('T')[0]; // Último día del mes
    
    // Consultar todos los registros para este curso y mes
    const { data: registros, error } = await supabase
      .from('asistencia')
      .select('fecha, estudiante_id, presente')
      .eq('curso_id', cursoId)
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);
      
    if (error) {
      throw new Error(error.message);
    }
    
    // Obtener estudiantes de este curso usando la vista/tabla correcta
    const { data: estudiantes, error: errorEstudiantes } = await supabase
      .from('estudiantes_detalles')
      .select('id, estudiante_id, fecha_matricula, fecha_retiro')
      .eq('curso_id', cursoId);
      
    if (errorEstudiantes) {
      throw new Error(errorEstudiantes.message);
    }
    
    // Calcular todos los días laborables del mes
    const diasDelMes = [];
    const diasEnMes = new Date(parseInt(año), parseInt(mes), 0).getDate();
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, dia);
      const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
      
      // Considerar días laborables (lunes a viernes)
      if (diaSemana > 0 && diaSemana < 6) {
        const fechaStr = fecha.toISOString().split('T')[0];
        diasDelMes.push(fechaStr);
      }
    }
    
    // Contar registros por día
    const registrosPorDia: Record<string, number> = {};
    diasDelMes.forEach(dia => {
      registrosPorDia[dia] = 0;
    });
    
    registros?.forEach(registro => {
      if (registrosPorDia[registro.fecha] !== undefined) {
        registrosPorDia[registro.fecha]++;
      }
    });
    
    // Evaluar completitud por día - CORREGIDO
    const completitudPorDia = diasDelMes.map(fecha => {
      // Calcular estudiantes que estaban matriculados específicamente en esta fecha
      const estudiantesMatriculadosFecha = estudiantes?.filter(est => {
        const fechaMatricula = new Date(est.fecha_matricula);
        const fechaDia = new Date(fecha);
        
        // Debe estar matriculado antes o en esta fecha
        if (fechaDia < fechaMatricula) return false;
        
        // Si tiene fecha de retiro, debe ser después de esta fecha
        if (est.fecha_retiro) {
          const fechaRetiro = new Date(est.fecha_retiro);
          if (fechaDia > fechaRetiro) return false;
        }
        
        return true;
      }).length || 0;
      
      const registrosEnFecha = registrosPorDia[fecha] || 0;
      const porcentaje = estudiantesMatriculadosFecha > 0 ? 
        Math.round((registrosEnFecha / estudiantesMatriculadosFecha) * 100) : 0;
      
      return {
        fecha,
        diaSemana: new Date(fecha).toLocaleDateString('es', { weekday: 'short' }),
        registros: registrosEnFecha,
        esperados: estudiantesMatriculadosFecha,
        completitud: porcentaje,
        status: porcentaje >= 95 ? 'completo' : porcentaje >= 70 ? 'parcial' : 'incompleto'
      };
    });
    
    // Análisis por día de la semana
    const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const analisisPorDiaSemana = diasSemana.map(dia => {
      const diasDeEsteTipo = completitudPorDia.filter(d => 
        d.diaSemana.toLowerCase().startsWith(dia)
      );
      
      const totalDias = diasDeEsteTipo.length;
      const totalRegistros = diasDeEsteTipo.reduce((sum, d) => sum + d.registros, 0);
      const totalEsperados = diasDeEsteTipo.reduce((sum, d) => sum + d.esperados, 0);
      const porcentajeCompletitud = totalEsperados > 0 ? Math.round((totalRegistros / totalEsperados) * 100) : 0;
      
      return {
        diaSemana: dia,
        totalDias,
        totalRegistros,
        totalEsperados,
        porcentajeCompletitud,
        status: porcentajeCompletitud >= 95 ? 'completo' : porcentajeCompletitud >= 70 ? 'parcial' : 'incompleto'
      };
    }).filter(d => d.totalDias > 0); // Solo mostrar días que tienen registros
    
    // Estadísticas generales - CORREGIDO
    const totalRegistros = registros?.length || 0;
    const diasHabiles = diasDelMes.length;
    const totalEsperadoCalculado = completitudPorDia.reduce((sum, dia) => sum + dia.esperados, 0);
    const porcentajeTotal = totalEsperadoCalculado > 0 ? Math.round((totalRegistros / totalEsperadoCalculado) * 100) : 0;
    
    // Detectar posibles duplicados
    const registrosUnicos = new Set();
    const duplicados: any[] = [];
    
    registros?.forEach(registro => {
      const key = `${registro.estudiante_id}_${registro.fecha}`;
      if (registrosUnicos.has(key)) {
        duplicados.push(registro);
      } else {
        registrosUnicos.add(key);
      }
    });
    
    return NextResponse.json({
      cursoId,
      mes,
      año,
      estudiantesActivosTotal: estudiantes?.length || 0,
      diasHabiles,
      totalRegistros,
      totalEsperado: totalEsperadoCalculado,
      porcentajeCompletitud: porcentajeTotal,
      posiblesDuplicados: duplicados.length,
      registrosDuplicados: duplicados.slice(0, 10), // Mostrar primeros 10 duplicados
      completitudPorDia,
      analisisPorDiaSemana,
      status: porcentajeTotal >= 95 ? 'completo' : porcentajeTotal >= 70 ? 'parcial' : 'incompleto'
    });
    
  } catch (err: any) {
    console.error('Error en GET /api/asistencia/analisis:', err);
    return NextResponse.json({ 
      error: err.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}