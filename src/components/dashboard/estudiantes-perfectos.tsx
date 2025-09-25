import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Nombre de los meses en español
const nombreMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface EstudiantePerfecto {
  id: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto: string;
  curso: string;
  diasPresente: number;
  diasRegistrados: number;
}

interface EstudiantesPerfectosProps {
  mes: number;
  año: number;
  estudiantes: EstudiantePerfecto[];
  isLoading?: boolean;
}

export function EstudiantesPerfectos({ mes, año, estudiantes, isLoading = false }: EstudiantesPerfectosProps) {
  // Ordenar estudiantes alfabéticamente por apellidos
  const estudiantesOrdenados = [...estudiantes]
    .sort((a, b) => {
      // Si tenemos apellidos separados, usar esos; si no, usar la primera parte del nombreCompleto
      const apellidosA = a.apellidos || a.nombreCompleto.split(',')[0];
      const apellidosB = b.apellidos || b.nombreCompleto.split(',')[0];
      return apellidosA.localeCompare(apellidosB, 'es', { sensitivity: 'base' });
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground text-sm">Cargando datos de asistencia...</p>
      </div>
    );
  }

  if (estudiantes.length === 0) {
    return (
      <div className="space-y-4">
        {/* Resumen cuando no hay datos */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold text-amber-600">0</span>
              <span className="text-muted-foreground ml-1">estudiantes con 100% de asistencia</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {nombreMeses[mes - 1]} {año}
            </div>
          </div>
        </div>
        
        {/* Mensaje informativo */}
        <div className="flex flex-col items-center justify-center h-32 space-y-2 border-2 border-dashed border-muted rounded-lg">
          <p className="text-muted-foreground font-medium">No hay alumnos con 100% de asistencia</p>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Esto puede deberse a que no hay registros de asistencia para este mes o ningún estudiante alcanzó el 100%.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen estadístico */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold text-green-600">{estudiantes.length}</span>
            <span className="text-muted-foreground ml-1">
              estudiante{estudiantes.length !== 1 ? 's' : ''} con 100% de asistencia
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {nombreMeses[mes - 1]} {año}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          Ordenado por apellidos
        </Badge>
      </div>

      {/* Tabla de estudiantes */}
      <ScrollArea className="h-64">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold w-[50%]">Nombre del Estudiante</TableHead>
              <TableHead className="font-semibold text-center w-[20%]">Curso</TableHead>
              <TableHead className="text-right font-semibold w-[30%]">Días Asistidos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estudiantesOrdenados.map((estudiante) => (
              <TableRow key={estudiante.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium py-3 pr-4">
                  <div className="truncate max-w-[280px]" title={estudiante.nombreCompleto}>
                    {estudiante.nombreCompleto}
                  </div>
                </TableCell>
                <TableCell className="text-center py-3">
                  <Badge variant="outline" className="text-xs font-medium">
                    {estudiante.curso}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-3 pl-4">
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {estudiante.diasPresente}/{estudiante.diasRegistrados}
                    </span>
                    <Badge variant="secondary" className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                      100%
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}