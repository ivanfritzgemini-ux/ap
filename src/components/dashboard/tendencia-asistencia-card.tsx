"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription 
} from "@/components/ui/card";
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, TrendingDown } from "lucide-react";
import { Badge } from '@/components/ui/badge';

interface TendenciaAsistencia {
  mes: number;
  año: number;
  nombre_mes: string;
  porcentaje: number;
  diferencia: number; // diferencia con respecto al mes anterior
}

export function TendenciaAsistenciaCard() {
  const [data, setData] = useState<TendenciaAsistencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTendenciaAsistencia();
  }, []);

  const cargarTendenciaAsistencia = async () => {
    setLoading(true);
    try {
      // En un caso real, aquí se haría la llamada a la API para obtener los datos
      // const response = await fetch('/api/asistencia/tendencia');
      // const result = await response.json();
      // setData(result.data);
      
      // Por ahora, simulamos datos de tendencia para 6 meses
      const mesesSimulados: TendenciaAsistencia[] = [
        { mes: 4, año: 2025, nombre_mes: 'Abril', porcentaje: 84, diferencia: -2 },
        { mes: 5, año: 2025, nombre_mes: 'Mayo', porcentaje: 86, diferencia: 2 },
        { mes: 6, año: 2025, nombre_mes: 'Junio', porcentaje: 82, diferencia: -4 },
        { mes: 7, año: 2025, nombre_mes: 'Julio', porcentaje: 85, diferencia: 3 },
        { mes: 8, año: 2025, nombre_mes: 'Agosto', porcentaje: 88, diferencia: 3 },
        { mes: 9, año: 2025, nombre_mes: 'Septiembre', porcentaje: 85, diferencia: -3 },
      ];
      
      setData(mesesSimulados);
    } catch (error) {
      console.error('Error al cargar tendencia de asistencia:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular la tendencia general
  const calcularTendenciaGeneral = () => {
    if (data.length < 2) return { texto: 'Sin datos suficientes', tendencia: 'neutral' };
    
    // Obtener los últimos tres meses para calcular la tendencia reciente
    const ultimosMeses = data.slice(-3);
    let sumaPositiva = 0;
    let sumaNegativa = 0;
    
    ultimosMeses.forEach(mes => {
      if (mes.diferencia > 0) sumaPositiva += mes.diferencia;
      if (mes.diferencia < 0) sumaNegativa += Math.abs(mes.diferencia);
    });
    
    if (sumaPositiva > sumaNegativa) {
      return { texto: 'Tendencia al alza', tendencia: 'positiva' };
    } else if (sumaNegativa > sumaPositiva) {
      return { texto: 'Tendencia a la baja', tendencia: 'negativa' };
    } else {
      return { texto: 'Tendencia estable', tendencia: 'neutral' };
    }
  };
  
  const tendenciaGeneral = calcularTendenciaGeneral();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span>Tendencia de Asistencia</span>
          </CardTitle>
          <Badge 
            variant={
              tendenciaGeneral.tendencia === 'positiva' ? 'default' : 
              tendenciaGeneral.tendencia === 'negativa' ? 'destructive' : 
              'outline'
            }
            className="text-xs"
          >
            {tendenciaGeneral.texto}
          </Badge>
        </div>
        <CardDescription>
          Comportamiento de asistencia en los últimos meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[150px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-3">
            {/* Grafico simplificado de tendencia */}
            <div className="relative h-16">
              <div className="absolute inset-0 flex items-end justify-between px-2">
                {data.map((mes, index) => (
                  <div 
                    key={`${mes.mes}-${mes.año}`} 
                    className="flex flex-col items-center gap-1 relative"
                    style={{ height: '100%', width: `${100 / data.length}%` }}
                  >
                    {/* Barra de porcentaje */}
                    <div 
                      className={`w-6 ${
                        mes.porcentaje >= 90 ? 'bg-green-500' :
                        mes.porcentaje >= 85 ? 'bg-green-400' :
                        mes.porcentaje >= 80 ? 'bg-yellow-500' :
                        'bg-red-500'
                      } rounded-t transition-all duration-300`}
                      style={{ height: `${mes.porcentaje}%` }}
                    >
                    </div>
                    
                    {/* Etiqueta de mes */}
                    <span className="text-2xs text-muted-foreground whitespace-nowrap">
                      {mes.nombre_mes.substring(0, 3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Lista detallada de los últimos 3 meses */}
            <div className="pt-4 space-y-2">
              {data.slice(-3).reverse().map(mes => (
                <div 
                  key={`${mes.mes}-${mes.año}-detail`}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{mes.nombre_mes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mes.porcentaje}%</span>
                    {mes.diferencia !== 0 && (
                      <span className={`flex items-center text-xs ${
                        mes.diferencia > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {mes.diferencia > 0 ? (
                          <>
                            <ArrowUpRight className="h-3 w-3" />
                            +{mes.diferencia}%
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-3 w-3" />
                            {mes.diferencia}%
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Recomendaciones basadas en la tendencia */}
            <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
              {tendenciaGeneral.tendencia === 'positiva' ? (
                <p>La asistencia muestra mejora. ¡Mantén las estrategias actuales!</p>
              ) : tendenciaGeneral.tendencia === 'negativa' ? (
                <p>La asistencia está bajando. Se recomienda revisar factores que puedan estar afectando.</p>
              ) : (
                <p>La asistencia se mantiene estable. Considera implementar incentivos para mejorarla.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[150px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No hay suficientes datos para mostrar la tendencia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}