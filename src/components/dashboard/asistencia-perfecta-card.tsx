"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle, Printer } from "lucide-react";
import { EstudiantesPerfectos } from './estudiantes-perfectos';

// Lista de meses escolares (marzo a diciembre)
const mesesEscolares = [
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' }
];

// Determinar el mes escolar actual (o el último si estamos en vacaciones)
function obtenerMesEscolarActual() {
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1; // Los meses en JS van de 0 a 11
  
  // Si estamos entre marzo y diciembre, usar el mes actual
  if (mesActual >= 3 && mesActual <= 12) {
    return mesActual.toString();
  }
  
  // Si estamos en enero o febrero, mostrar diciembre del año anterior
  return '12';
}

// Determinar el año académico actual
function obtenerAñoEscolarActual() {
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1;
  const añoActual = fechaActual.getFullYear();
  
  // Si estamos en enero o febrero, usar el año anterior
  if (mesActual < 3) {
    return (añoActual - 1).toString();
  }
  
  return añoActual.toString();
}

export function AsistenciaPerfectaCard() {
  const [selectedMes, setSelectedMes] = useState(obtenerMesEscolarActual());
  const [selectedAño, setSelectedAño] = useState(obtenerAñoEscolarActual());
  const [loading, setLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);

  useEffect(() => {
    cargarEstudiantesPerfectos();
  }, [selectedMes, selectedAño]);

  const cargarEstudiantesPerfectos = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/asistencia/perfecta?mes=${selectedMes.padStart(2, '0')}&año=${selectedAño}`
      );
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setEstudiantes(data.estudiantes_perfectos || []);
    } catch (error) {
      console.error('Error al cargar estudiantes con asistencia perfecta:', error);
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  const generarReporte = () => {
    // Crear ventana de impresión
    const mesNombre = mesesEscolares.find(m => m.valor.toString() === selectedMes)?.nombre;
    const contenidoImprimir = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Asistencia Perfecta - ${mesNombre} ${selectedAño}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; text-align: center; margin-bottom: 20px; }
          h2 { font-size: 16px; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          ul { list-style-type: none; padding: 0; }
          li { margin-bottom: 5px; font-size: 14px; }
          .footer { margin-top: 30px; font-size: 12px; text-align: center; color: #666; }
          .empty { text-align: center; font-style: italic; margin: 20px 0; }
          .curso-info { display: flex; justify-content: space-between; }
          .estudiante-nombre { margin-right: 15px; }
        </style>
      </head>
      <body>
        <h1>Alumnos con Asistencia 100% - ${mesNombre} ${selectedAño}</h1>
    `;

    // Agrupar por curso
    const estudiantesPorCurso: Record<string, any[]> = {};
    estudiantes.forEach(est => {
      if (!estudiantesPorCurso[est.nombre_curso]) {
        estudiantesPorCurso[est.nombre_curso] = [];
      }
      estudiantesPorCurso[est.nombre_curso].push(est);
    });

    // Generar HTML para cada curso
    let contenidoCursos = '';
    if (Object.keys(estudiantesPorCurso).length === 0) {
      contenidoCursos = '<p class="empty">No hay alumnos con 100% de asistencia para este mes.</p>';
    } else {
      for (const [curso, estudiantes] of Object.entries(estudiantesPorCurso)) {
        contenidoCursos += `
          <h2>${curso} (${estudiantes.length} alumno${estudiantes.length !== 1 ? 's' : ''})</h2>
          <ul>
        `;
        
        estudiantes.sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach(est => {
          contenidoCursos += `
            <li>
              <div class="curso-info">
                <span class="estudiante-nombre">${est.nombre}</span>
                <span>${est.dias_asistidos}/${est.total_dias_obligatorios} días</span>
              </div>
            </li>
          `;
        });
        
        contenidoCursos += '</ul>';
      }
    }

    const fechaGeneracion = new Date().toLocaleDateString('es-CL');
    const contenidoFinal = `
      ${contenidoImprimir}
      ${contenidoCursos}
      <div class="footer">
        <p>Reporte generado el ${fechaGeneracion}</p>
      </div>
      </body>
      </html>
    `;

    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(contenidoFinal);
      ventanaImpresion.document.close();
      
      // Esperar a que los estilos se apliquen y luego imprimir
      setTimeout(() => {
        ventanaImpresion.print();
        // No cerrar la ventana después de imprimir para permitir guardar como PDF
      }, 500);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
          <CheckCircle className="h-5 w-5"/>
          Estudiantes con Asistencia Perfecta
        </CardTitle>
        <CardDescription>
          Lista de estudiantes con 100% de asistencia por mes. Incluye nombre, curso y días asistidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-between gap-2 mb-4">
          <div className="flex gap-2">
            <Select
              value={selectedMes}
              onValueChange={setSelectedMes}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Seleccione un mes" />
              </SelectTrigger>
              <SelectContent>
                {mesesEscolares.map((mes) => (
                  <SelectItem key={mes.valor} value={mes.valor.toString()}>
                    {mes.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedAño}
              onValueChange={setSelectedAño}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={generarReporte}
            disabled={loading || estudiantes.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Informe
          </Button>
        </div>
        
        {/* Lista de estudiantes */}
        <div className="border rounded-lg overflow-hidden">
          <EstudiantesPerfectos 
            mes={parseInt(selectedMes)} 
            año={parseInt(selectedAño)}
            estudiantes={estudiantes}
            isLoading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}