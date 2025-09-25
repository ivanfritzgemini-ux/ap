"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { GaugeChart, AttendanceGaugeCard } from "@/components/ui/gauge-chart";
import { RadialProgress, RadialGrid } from "@/components/ui/radial-progress";
import { CalendarCheck, UserCheck, Users, AlertTriangle, TrendingUp } from "lucide-react";

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

export function ResumenAsistenciaModernCard() {
  const [data, setData] = useState<ResumenAsistencia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarResumenAsistencia();
  }, []);

  const cargarResumenAsistencia = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/asistencia/resumen');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      const fechaActual = new Date();
      let añoEscolar = fechaActual.getFullYear();
      
      if (fechaActual.getMonth() < 2) {
        añoEscolar = añoEscolar - 1;
      }

      setData({
        mes: 'Año Escolar',
        año: añoEscolar.toString(),
        asistenciaPromedio: result.asistenciaPromedio || 0,
        diasHabiles: result.diasHabiles || 0,
        cursos: result.cursos || [],
        cursosConProblemas: result.cursosConProblemas || 0
      });
    } catch (error) {
      console.error('Error al cargar resumen de asistencia:', error);
      
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
    <Card className="overflow-hidden bg-gradient-to-br from-background to-secondary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resumen de Asistencia
              </span>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                Visualización moderna con indicadores radiales
              </p>
            </div>
          </div>
          {!loading && data && (
            <div className="text-right">
              <div className="text-sm font-medium text-muted-foreground">
                {data.mes} {data.año}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3" />
                Datos en tiempo real
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Cargando datos de asistencia...</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-8">
            
            {/* Gauge principal de asistencia */}
            <AttendanceGaugeCard
              value={data.asistenciaPromedio}
              title="Asistencia Promedio"
              subtitle={`${data.mes} ${data.año}`}
              additionalStats={[
                { 
                  label: "Días hábiles", 
                  value: data.diasHabiles 
                },
                { 
                  label: "Cursos activos", 
                  value: data.cursos.length 
                },
                { 
                  label: data.cursosConProblemas > 0 ? "Cursos críticos" : "Meta anual", 
                  value: data.cursosConProblemas > 0 ? data.cursosConProblemas : "85%" 
                }
              ]}
            />

            {/* Grid de cursos con indicadores radiales */}
            {data.cursos && data.cursos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Asistencia por Curso</h3>
                  <div className="text-xs text-muted-foreground">
                    Ordenado por rendimiento
                  </div>
                </div>
                
                <RadialGrid
                  items={data.cursos
                    .sort((a, b) => b.asistenciaPromedio - a.asistenciaPromedio)
                    .slice(0, 8) // Mostrar solo los primeros 8 cursos
                    .map(curso => ({
                      id: curso.id,
                      value: curso.asistenciaPromedio,
                      label: curso.nombre.length > 12 
                        ? `${curso.nombre.substring(0, 12)}...` 
                        : curso.nombre,
                      sublabel: `${curso.asistenciaPromedio}%`
                    }))
                  }
                />
                
                {data.cursos.length > 8 && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Y {data.cursos.length - 8} cursos más...
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-full bg-muted/30">
              <CalendarCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No hay datos de asistencia disponibles
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Los datos se mostrarán cuando haya registros de asistencia en el sistema
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}