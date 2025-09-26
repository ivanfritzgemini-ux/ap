"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, UserCheck, Users, AlertTriangle } from "lucide-react";
import { AttendanceGauge } from "./attendance-gauge";

interface ResumenAsistencia {
  mes: string;
  año: string;
  asistenciaPromedio: number;
  diasHabiles: number;
  cursos: {
    id: string;
    nombre: string;
    asistenciaPromedio: number;
  }[];
  cursosConProblemas: number;
}

export function ResumenAsistenciaCard() {
  const [data, setData] = useState<ResumenAsistencia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarResumenAsistencia();
  }, []);

  const cargarResumenAsistencia = async () => {
    setLoading(true);
    try {
      // Realizar la consulta a la API actualizada
      const response = await fetch('/api/asistencia/resumen');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      // Obtener el año escolar actual
      const fechaActual = new Date();
      let añoEscolar = fechaActual.getFullYear();
      
      if (fechaActual.getMonth() < 2) { // Enero o Febrero
        añoEscolar = añoEscolar - 1;
      }

      setData({
        mes: 'Año Escolar', // Cambiamos a mostrar año completo en lugar de mes
        año: añoEscolar.toString(),
        asistenciaPromedio: result.asistenciaPromedio || 0,
        diasHabiles: result.diasHabiles || 0,
        cursos: result.cursos || [],
        cursosConProblemas: result.cursosConProblemas || 0
      });
    } catch (error) {
      console.error('Error al cargar resumen de asistencia:', error);
      
      // En caso de error, mostrar mensaje informativo
      setData({
        mes: 'Sin datos',
        año: new Date().getFullYear().toString(),
        asistenciaPromedio: 0,
        diasHabiles: 0,
        cursos: [],
        cursosConProblemas: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const obtenerNombreMes = (mes: number): string => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-500" />
            <span>Resumen de Asistencia</span>
          </div>
          {!loading && data && (
            <span className="text-sm font-normal text-muted-foreground">
              {data.mes} {data.año}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Cargando datos de asistencia...</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Gauge de asistencia promedio - Centrado arriba */}
            <div className="flex justify-center">
              <AttendanceGauge percentage={data.asistenciaPromedio} size={260} />
            </div>
            
            {/* Información adicional - Debajo del gauge */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-muted-foreground">Días Hábiles</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{data.diasHabiles}</div>
                </div>
                
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-muted-foreground">Total Cursos</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">{data.cursos.length}</div>
                </div>
              </div>
              
              {/* Alerta de cursos con problemas */}
              {data.cursosConProblemas > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    {data.cursosConProblemas} curso{data.cursosConProblemas !== 1 ? 's' : ''} con asistencia crítica (menos del 80%)
                  </span>
                </div>
              )}
            </div>

            {/* Top 3 cursos con mejor asistencia */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Top 3 Cursos - Mejor Asistencia</div>
              
              {/* Cursos en formato más compacto */}
              <div className="grid gap-2">
                {data.cursos
                  .sort((a, b) => b.asistenciaPromedio - a.asistenciaPromedio)
                  .slice(0, 3)
                  .map((curso, index) => (
                    <div key={curso.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          'bg-amber-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-xs font-medium truncate">{curso.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-xs font-bold ${
                          curso.asistenciaPromedio >= 95 ? 'text-green-600' :
                          curso.asistenciaPromedio >= 90 ? 'text-green-500' :
                          curso.asistenciaPromedio >= 85 ? 'text-yellow-500' :
                          curso.asistenciaPromedio >= 80 ? 'text-orange-500' :
                          'text-red-500'
                        }`}>
                          {curso.asistenciaPromedio}%
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center space-y-2">
            <p className="text-sm text-muted-foreground">No hay datos de asistencia disponibles</p>
            <p className="text-xs text-muted-foreground text-center">
              Los datos se mostrarán cuando haya registros de asistencia en el sistema
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}