'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, GraduationCap, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { updateStudentAttendance } from '@/lib/data';
import type { TeacherCourse, TeacherAttendanceData, DayAttendance } from '@/lib/data';

interface AttendanceManagementProps {
  courses: TeacherCourse[];
  selectedCourseId?: string;
  selectedDate?: string;
  attendanceData: TeacherAttendanceData | null;
  currentMonth: string;
}

interface AttendanceUpdate {
  studentId: string;
  date: string;
  status: 'presente' | 'ausente' | 'justificado';
}

export function AttendanceManagement({ 
  courses, 
  selectedCourseId, 
  selectedDate,
  attendanceData,
  currentMonth 
}: AttendanceManagementProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const selectedCourse = selectedCourseId 
    ? courses.find(c => c.id === selectedCourseId)
    : null;

  // Manejar cambio de curso
  const handleCourseChange = (courseId: string) => {
    const params = new URLSearchParams();
    params.set('course', courseId);
    router.push(`/dashboard/teacher/attendance?${params.toString()}`);
  };

  // Manejar cambio de fecha
  const handleDateChange = (date: string) => {
    if (!selectedCourseId) return;
    
    const params = new URLSearchParams();
    params.set('course', selectedCourseId);
    params.set('date', date);
    router.push(`/dashboard/teacher/attendance?${params.toString()}`);
  };

  // Actualizar asistencia de un estudiante
  const handleAttendanceUpdate = async (update: AttendanceUpdate) => {
    if (!selectedCourseId) return;

    setIsUpdating(`${update.studentId}-${update.date}`);

    try {
      await updateStudentAttendance(
        update.studentId,
        selectedCourseId,
        update.date,
        update.status
      );

      // Recargar la página para mostrar los datos actualizados
      router.refresh();
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Obtener el estado de asistencia para un estudiante en una fecha
  const getAttendanceStatus = (studentId: string, date: string): string => {
    if (!attendanceData?.daily_attendance) return 'sin_registro';

    const dayData = attendanceData.daily_attendance.find(d => d.date === date);
    if (!dayData) return 'sin_registro';

    const record = dayData.students.find(s => s.id === studentId);
    return record?.attendance_status || 'sin_registro';
  };

  // Renderizar badge de estado
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'presente':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Presente</Badge>;
      case 'ausente':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ausente</Badge>;
      case 'justificado':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Justificado</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Sin registro</Badge>;
    }
  };

  // Generar fechas del mes actual (solo días hábiles)
  const getWorkingDaysOfMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = new Date(year, month, now.getDate());
    
    const days = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      // Solo días de lunes (1) a viernes (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && date <= today) {
        days.push(date.toISOString().split('T')[0]);
      }
    }
    
    return days.reverse(); // Mostrar fechas más recientes primero
  };

  const workingDays = getWorkingDaysOfMonth();

  return (
    <div className="space-y-6">
      {/* Selector de curso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Selección de Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourseId || ""} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un curso para gestionar asistencia..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{course.nombre_curso}</span>
                    <div className="flex gap-1 ml-2">
                      {course.es_profesor_jefe && (
                        <Badge variant="default" className="text-xs">Profesor Jefe</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {course.estudiantes_activos} estudiantes
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCourse && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedCourse.nombre_curso}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCourse.estudiantes_activos} estudiantes activos
                    {selectedCourse.es_profesor_jefe && " • Usted es el Profesor Jefe"}
                  </p>
                </div>
                <Badge variant={selectedCourse.es_profesor_jefe ? "default" : "secondary"}>
                  {selectedCourse.es_profesor_jefe ? "Gestión Completa" : "Solo Asistencia"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {!selectedCourse ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecciona un curso</h3>
              <p className="text-muted-foreground">
                Elige un curso para gestionar la asistencia del mes de {currentMonth}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Selector de fecha */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fecha de Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDate || ""} onValueChange={handleDateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una fecha..." />
                </SelectTrigger>
                <SelectContent>
                  {workingDays.map((date) => {
                    const dateObj = new Date(date);
                    const formattedDate = dateObj.toLocaleDateString('es-CL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    
                    return (
                      <SelectItem key={date} value={date}>
                        {formattedDate}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tabla de asistencia */}
          {selectedDate && attendanceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Asistencia - {new Date(selectedDate).toLocaleDateString('es-CL')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Estado Actual</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.students.map((student) => {
                      const status = getAttendanceStatus(student.id, selectedDate);
                      const isUpdating_current = isUpdating === `${student.id}-${selectedDate}`;

                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {student.nombre} {student.apellido}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                RUT: {student.rut}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderStatusBadge(status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={status === 'presente' ? 'default' : 'outline'}
                                disabled={isUpdating_current}
                                onClick={() => handleAttendanceUpdate({
                                  studentId: student.id,
                                  date: selectedDate,
                                  status: 'presente'
                                })}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Presente
                              </Button>
                              <Button
                                size="sm"
                                variant={status === 'ausente' ? 'destructive' : 'outline'}
                                disabled={isUpdating_current}
                                onClick={() => handleAttendanceUpdate({
                                  studentId: student.id,
                                  date: selectedDate,
                                  status: 'ausente'
                                })}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Ausente
                              </Button>
                              <Button
                                size="sm"
                                variant={status === 'justificado' ? 'secondary' : 'outline'}
                                disabled={isUpdating_current}
                                onClick={() => handleAttendanceUpdate({
                                  studentId: student.id,
                                  date: selectedDate,
                                  status: 'justificado'
                                })}
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Justificado
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Vista de resumen mensual */}
          {!selectedDate && attendanceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Resumen de Asistencia - {currentMonth}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceData.students.map((student) => {
                    // Calcular estadísticas del estudiante
                    let presente = 0;
                    let ausente = 0;
                    let justificado = 0;
                    let total = 0;

                    workingDays.forEach(date => {
                      const status = getAttendanceStatus(student.id, date);
                      if (status !== 'sin_registro') {
                        total++;
                        if (status === 'presente') presente++;
                        else if (status === 'ausente') ausente++;
                        else if (status === 'justificado') justificado++;
                      }
                    });

                    const porcentajeAsistencia = total > 0 ? Math.round((presente / total) * 100) : 0;

                    return (
                      <div key={student.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{student.nombre} {student.apellido}</h4>
                            <p className="text-sm text-muted-foreground">RUT: {student.rut}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {porcentajeAsistencia}%
                            </div>
                            <p className="text-sm text-muted-foreground">Asistencia</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Presente: {presente}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>Ausente: {ausente}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span>Justificado: {justificado}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}