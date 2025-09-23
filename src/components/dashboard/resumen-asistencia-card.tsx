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
      // Obtener el mes actual o el mes escolar más reciente
      const fechaActual = new Date();
      let mesActual = fechaActual.getMonth() + 1; // 1-12
      let añoActual = fechaActual.getFullYear();

      // Ajustar para año escolar (si estamos en enero o febrero, mostrar diciembre del año anterior)
      if (mesActual < 3) {
        mesActual = 12;
        añoActual = añoActual - 1;
      }

      // Convertir a string con formato
      const mesStr = mesActual.toString().padStart(2, '0');
      const añoStr = añoActual.toString();

      // Realizar la consulta a la API
      const response = await fetch('/api/asistencia/resumen');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Simulación de datos para mostrar la estructura (en un caso real, estos vendrían de la API)
      // Esto se reemplazaría con la lógica real basada en los datos de result
      setData({
        mes: obtenerNombreMes(mesActual),
        año: añoStr,
        asistenciaPromedio: 85, // Porcentaje promedio de asistencia
        diasHabiles: 20,        // Días hábiles del mes
        cursos: [
          { id: '1', nombre: '1° Básico', asistenciaPromedio: 92 },
          { id: '2', nombre: '2° Básico', asistenciaPromedio: 88 },
          { id: '3', nombre: '3° Básico', asistenciaPromedio: 79 },
          { id: '4', nombre: '4° Básico', asistenciaPromedio: 85 },
          { id: '5', nombre: '5° Básico', asistenciaPromedio: 91 }
        ],
        cursosConProblemas: 1
      });
    } catch (error) {
      console.error('Error al cargar resumen de asistencia:', error);
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

  const getProgressColor = (porcentaje: number): string => {
    if (porcentaje >= 90) return "bg-green-500";
    if (porcentaje >= 85) return "bg-green-400";
    if (porcentaje >= 80) return "bg-yellow-400";
    return "bg-red-500";
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
            {/* Estadísticas generales */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">Asistencia promedio</div>
                <div className="font-bold">{data.asistenciaPromedio}%</div>
              </div>
              <Progress 
                value={data.asistenciaPromedio} 
                max={100}
                className="h-2"
                indicatorClassName={getProgressColor(data.asistenciaPromedio)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <div>
                  <UserCheck className="h-3.5 w-3.5 inline-block mr-1" />
                  {data.diasHabiles} días hábiles
                </div>
                <div>
                  <Users className="h-3.5 w-3.5 inline-block mr-1" />
                  {data.cursos.length} cursos
                </div>
              </div>
            </div>

            {/* Cursos con mejor y peor asistencia */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Asistencia por curso</div>
              
              {/* Cursos ordenados por asistencia (primero los 5 mejores) */}
              <div className="space-y-2.5">
                {data.cursos
                  .sort((a, b) => b.asistenciaPromedio - a.asistenciaPromedio)
                  .slice(0, 5)
                  .map(curso => (
                    <div key={curso.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div>{curso.nombre}</div>
                        <div className={`font-medium ${
                          curso.asistenciaPromedio < 80 ? 'text-red-500' : 
                          curso.asistenciaPromedio >= 90 ? 'text-green-500' : ''
                        }`}>
                          {curso.asistenciaPromedio}%
                        </div>
                      </div>
                      <Progress 
                        value={curso.asistenciaPromedio} 
                        max={100}
                        className="h-1"
                        indicatorClassName={getProgressColor(curso.asistenciaPromedio)}
                      />
                    </div>
                  ))
                }
              </div>

              {/* Alerta de cursos con problemas */}
              {data.cursosConProblemas > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 mt-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>
                    {data.cursosConProblemas} curso{data.cursosConProblemas !== 1 ? 's' : ''} con asistencia crítica (menos del 80%)
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}