"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription 
} from "@/components/ui/card";
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, TrendingDown, BarChart3 } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface TendenciaAsistencia {
  mes: number;
  año: number;
  nombre_mes: string;
  porcentaje: number;
  diferencia: number;
  total_registros: number;
  presentes: number;
}

interface EstadisticasTendencia {
  promedioGeneral: number;
  tendenciaGeneral: string;
  mejorMes: {
    nombre: string;
    porcentaje: number;
  };
  peorMes: {
    nombre: string;
    porcentaje: number;
  };
  totalMeses: number;
}

export function TendenciaAsistenciaCard() {
  const [data, setData] = useState<TendenciaAsistencia[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasTendencia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTendenciaAsistencia();
  }, []);

  const cargarTendenciaAsistencia = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/asistencia/tendencia');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      setData(result.tendencia || []);
      setEstadisticas(result.estadisticas || null);
    } catch (error) {
      console.error('Error al cargar tendencia de asistencia:', error);
      setData([]);
      setEstadisticas(null);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el color del gráfico basado en el promedio
  const getChartColor = (promedio: number) => {
    if (promedio >= 95) return '#22c55e'; // Verde brillante
    if (promedio >= 90) return '#84cc16'; // Verde lima
    if (promedio >= 85) return '#eab308'; // Amarillo
    if (promedio >= 80) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  };

  // Preparar datos para el gráfico (últimos 6 meses)
  const chartData = data.slice(-6).map(item => ({
    ...item,
    mes_corto: item.nombre_mes.substring(0, 3)
  }));

  const promedioChart = estadisticas?.promedioGeneral || 0;
  const chartColor = getChartColor(promedioChart);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <span>Tendencia de Asistencia</span>
          </CardTitle>
          {estadisticas && (
            <Badge 
              variant={
                estadisticas.tendenciaGeneral === 'al_alza' ? 'default' : 
                estadisticas.tendenciaGeneral === 'a_la_baja' ? 'destructive' : 
                'outline'
              }
              className="text-xs"
            >
              {estadisticas.tendenciaGeneral === 'al_alza' ? 'Tendencia al Alza' :
               estadisticas.tendenciaGeneral === 'a_la_baja' ? 'Tendencia a la Baja' :
               'Tendencia Estable'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Evolución mensual del porcentaje de asistencia
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Cargando datos de tendencia...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-6">
            {/* Gráfico moderno de área */}
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="mes_corto" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    domain={[70, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-lg">
                            <p className="font-medium">{data.nombre_mes} {data.año}</p>
                            <p className="text-sm">
                              <span className="font-medium">Asistencia: </span>
                              <span style={{ color: chartColor }}>{data.porcentaje}%</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {data.presentes}/{data.total_registros} registros
                            </p>
                            {data.diferencia !== 0 && (
                              <p className={`text-xs ${data.diferencia > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data.diferencia > 0 ? '+' : ''}{data.diferencia}% vs mes anterior
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={85} stroke="#eab308" strokeDasharray="5 5" opacity={0.7} />
                  <Area
                    type="monotone"
                    dataKey="porcentaje"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={chartColor}
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Estadísticas resumidas */}
            {estadisticas && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-muted-foreground">Mejor Mes</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">{estadisticas.mejorMes.porcentaje}%</div>
                  <div className="text-xs text-muted-foreground">{estadisticas.mejorMes.nombre}</div>
                </div>
                
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium text-muted-foreground">Peor Mes</span>
                  </div>
                  <div className="text-lg font-bold text-red-600">{estadisticas.peorMes.porcentaje}%</div>
                  <div className="text-xs text-muted-foreground">{estadisticas.peorMes.nombre}</div>
                </div>
              </div>
            )}

            {/* Recomendaciones basadas en la tendencia */}
            {estadisticas && (
              <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                {estadisticas.tendenciaGeneral === 'al_alza' ? (
                  <p>📈 La asistencia muestra mejora constante. ¡Excelente trabajo!</p>
                ) : estadisticas.tendenciaGeneral === 'a_la_baja' ? (
                  <p>📉 La asistencia está bajando. Se recomienda revisar factores que puedan estar afectando.</p>
                ) : (
                  <p>📊 La asistencia se mantiene estable en {estadisticas.promedioGeneral}%. Considera implementar estrategias para mejorarla.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center space-y-2">
            <p className="text-sm text-muted-foreground">No hay datos de tendencia disponibles</p>
            <p className="text-xs text-muted-foreground text-center">
              Los datos aparecerán cuando haya suficientes registros de asistencia
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}