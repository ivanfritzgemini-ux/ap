'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString('es-CL');
  } catch (error) {
    return 'Fecha inválida';
  }
};

const formatEnrollmentDate = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const cutoffDate = new Date('2025-03-05');
    
    // Ocultar fechas anteriores al 05-03-2025
    if (date < cutoffDate) {
      return '-';
    }
    
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString('es-CL');
  } catch (error) {
    return 'Fecha inválida';
  }
};

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({ totalActivos: 0, totalRetirados: 0, totalFemeninos: 0, totalMasculinos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params;
      
      try {
        const [courseResponse, studentsResponse, statisticsResponse] = await Promise.all([
          fetch(`/api/courses/${id}`),
          fetch(`/api/courses/${id}/students`),
          fetch(`/api/courses/${id}/statistics`)
        ]);

        if (!courseResponse.ok) {
          if (courseResponse.status === 404) {
            router.push('/dashboard/admin/courses');
            return;
          }
          throw new Error('Failed to fetch course data');
        }

        const [courseData, studentsData, statisticsData] = await Promise.all([
          courseResponse.json(),
          studentsResponse.json(),
          statisticsResponse.json()
        ]);

        setCourse(courseData.data);
        setStudents(studentsData.data || []);
        setStatistics(statisticsData.data || { totalActivos: 0, totalRetirados: 0, totalFemeninos: 0, totalMasculinos: 0 });
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('Error al cargar los datos del curso');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-500">{error}</div>;
  }

  if (!course) {
    return <div className="flex items-center justify-center h-64">Curso no encontrado</div>;
  }

  // Función para generar la nómina de estudiantes con 30 filas
  const generatePrintableList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Crear un array de 30 elementos con estudiantes actuales + filas vacías
    const printStudents = [...students];
    while (printStudents.length < 30) {
      printStudents.push({ 
        id: `empty-${printStudents.length}`, 
        registration_number: '', 
        name: '', 
        enrollment_date: null, 
        withdrawal_date: null 
      });
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nómina de Alumnos por Curso 2025</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4;
              margin: 1.5cm;
            }
            @media print {
              body {
                zoom: 0.95;
              }
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.2;
              margin: 0;
              padding: 0;
              color: #000;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            
            .header h1 {
              font-size: 16pt;
              font-weight: bold;
              margin: 0 0 10px 0;
              text-transform: uppercase;
            }
            
            .course-info {
              margin-bottom: 25px;
            }
            
            .course-info div {
              margin-bottom: 8px;
            }
            
            .course-info strong {
              font-weight: bold;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10pt;
            }
            
            th, td {
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: left;
              vertical-align: top;
            }
            
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            
            .col-num { width: 8%; text-align: center; }
            .col-reg { width: 15%; text-align: center; }
            .col-matricula { width: 18%; text-align: center; }
            .col-retiro { width: 18%; text-align: center; }
            .col-nombre { width: 41%; }
            
            .empty-row td {
              height: 18px;
              border-color: #666;
            }
            
            .withdrawn {
              text-decoration: line-through;
              color: #666;
            }
            
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Nómina de Alumnos por Curso 2025</h1>
          </div>
          
          <div class="course-info">
            <div><strong>Curso:</strong> ${course.nombre_curso}</div>
            <div><strong>Profesor Jefe:</strong> ${course.profesor_jefe || 'No asignado'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="col-num">N°</th>
                <th class="col-reg">N° Registro</th>
                <th class="col-matricula">Fecha Matrícula</th>
                <th class="col-retiro">Fecha Retiro</th>
                <th class="col-nombre">Nombre del Alumno</th>
              </tr>
            </thead>
            <tbody>
              ${printStudents.map((student, index) => {
                const isWithdrawn = student.withdrawal_date;
                const enrollmentDate = student.enrollment_date ? formatEnrollmentDate(student.enrollment_date) : '';
                const withdrawalDate = student.withdrawal_date ? formatDate(student.withdrawal_date) : '';
                
                if (!student.name) {
                  return `
                    <tr class="empty-row">
                      <td class="col-num">${index + 1}</td>
                      <td class="col-reg"></td>
                      <td class="col-matricula"></td>
                      <td class="col-retiro"></td>
                      <td class="col-nombre"></td>
                    </tr>
                  `;
                }
                
                return `
                  <tr${isWithdrawn ? ' class="withdrawn"' : ''}>
                    <td class="col-num">${index + 1}</td>
                    <td class="col-reg">${student.registration_number || ''}</td>
                    <td class="col-matricula">${enrollmentDate}</td>
                    <td class="col-retiro">${withdrawalDate}</td>
                    <td class="col-nombre">${student.name}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/courses">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl md:text-2xl font-headline font-semibold">Ficha del Curso</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm md:text-base">
          <div className="flex justify-between">
            <span className="font-semibold">Nombre del Curso:</span>
            <span>{course.nombre_curso}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Profesor Jefe:</span>
            <span>{course.profesor_jefe || 'No asignado'}</span>
          </div>
          
          {/* Separador */}
          <div className="border-t pt-2 mt-4">
            <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mb-2">Estadísticas</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold">Activos:</span>
                <span>{statistics.totalActivos}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Retirados:</span>
                <span>{statistics.totalRetirados}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Femeninos:</span>
                <span>{statistics.totalFemeninos}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Masculinos:</span>
                <span>{statistics.totalMasculinos}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Alumnos</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generatePrintableList}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir Nómina
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead>N° Registro</TableHead>
                  <TableHead>Fecha de Matrícula</TableHead>
                  <TableHead>Fecha de Retiro</TableHead>
                  <TableHead>Nombre del Alumno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student, index) => (
                    <TableRow key={student.id} className={cn({
                      "line-through text-muted-foreground": student.withdrawal_date,
                    })}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{student.registration_number}</TableCell>
                      <TableCell>{formatEnrollmentDate(student.enrollment_date)}</TableCell>
                      <TableCell>{formatDate(student.withdrawal_date)}</TableCell>
                      <TableCell>{student.name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No hay alumnos en este curso.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
