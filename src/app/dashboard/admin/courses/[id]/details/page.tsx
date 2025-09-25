import { getCourseDetails, getStudentsByCourse, getCourseStatistics } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default async function CourseDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const [course, students, statistics] = await Promise.all([
    getCourseDetails(id),
    getStudentsByCourse(id),
    getCourseStatistics(id)
  ]);

  if (!course) {
    notFound();
  }

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
          <CardTitle>Lista de Alumnos</CardTitle>
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
                      <TableCell>{formatDate(student.enrollment_date)}</TableCell>
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
