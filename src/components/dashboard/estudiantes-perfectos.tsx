import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Nombre de los meses en español
const nombreMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface EstudiantePerfecto {
  id: string;
  nombre: string;
  curso_id: string;
  nombre_curso: string;
  dias_asistidos: number;
  total_dias_obligatorios: number;
}

interface EstudiantesPerfectosProps {
  mes: number;
  año: number;
  estudiantes: EstudiantePerfecto[];
  isLoading?: boolean;
}

export function EstudiantesPerfectos({ mes, año, estudiantes, isLoading = false }: EstudiantesPerfectosProps) {
  // Agrupar estudiantes por curso para mejor visualización
  const estudiantesPorCurso: Record<string, EstudiantePerfecto[]> = {};
  
  estudiantes.forEach(estudiante => {
    const cursoId = estudiante.curso_id;
    if (!estudiantesPorCurso[cursoId]) {
      estudiantesPorCurso[cursoId] = [];
    }
    estudiantesPorCurso[cursoId].push(estudiante);
  });

  // Ordenar cursos alfabéticamente
  const cursos = Object.keys(estudiantesPorCurso).sort((a, b) => {
    const nombreA = estudiantesPorCurso[a][0].nombre_curso;
    const nombreB = estudiantesPorCurso[b][0].nombre_curso;
    return nombreA.localeCompare(nombreB);
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
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">No hay alumnos con 100% de asistencia para {nombreMeses[mes - 1]} {año}.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-72">
      <div className="space-y-4">
        {cursos.map((cursoId) => (
          <div key={cursoId} className="space-y-2">
            <div className="sticky top-0 bg-background py-1 z-10">
              <Badge variant="outline" className="font-medium">
                {estudiantesPorCurso[cursoId][0].nombre_curso}
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">
                {estudiantesPorCurso[cursoId].length} alumno{estudiantesPorCurso[cursoId].length !== 1 ? 's' : ''}
              </span>
            </div>
            <ul className="space-y-1">
              {estudiantesPorCurso[cursoId]
                .sort((a, b) => a.nombre.localeCompare(b.nombre)) // Ordenar alfabéticamente
                .map((estudiante) => (
                <li key={estudiante.id} className="text-sm flex items-center justify-between">
                  <span>{estudiante.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {estudiante.dias_asistidos}/{estudiante.total_dias_obligatorios} días
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}