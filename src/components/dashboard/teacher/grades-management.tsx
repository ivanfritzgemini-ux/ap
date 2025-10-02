"use client"

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Save, 
  AlertCircle, 
  Award,
  ChevronDown,
  FileText 
} from 'lucide-react';
import { TeacherCourse, StudentGrade } from '@/lib/data';
import { toast } from '@/hooks/use-toast';

interface GradesManagementProps {
  courses: TeacherCourse[];
  selectedCourseId?: string;
  selectedSubjectId?: string;
  initialGrades: StudentGrade[];
}

export function GradesManagement({
  courses,
  selectedCourseId,
  selectedSubjectId,
  initialGrades
}: GradesManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedCourse, setSelectedCourse] = useState<string>(selectedCourseId || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedSubjectId || '');
  const [grades, setGrades] = useState<StudentGrade[]>(initialGrades);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  // Obtener el curso seleccionado
  const currentCourse = courses.find(c => c.id === selectedCourse);
  
  // Actualizar URL cuando cambian las selecciones
  const updateUrl = (courseId: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.set('course', courseId);
    if (subjectId) params.set('subject', subjectId);
    
    const queryString = params.toString();
    const newUrl = queryString ? `/dashboard/teacher/grades?${queryString}` : '/dashboard/teacher/grades';
    router.push(newUrl);
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedSubject('');
    setGrades([]);
    updateUrl(courseId);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    updateUrl(selectedCourse, subjectId);
  };

  // Función para actualizar calificaciones (mock por ahora)
  const updateGrade = (studentId: string, subjectId: string, value: number | null) => {
    setGrades(prev => prev.map(student => ({
      ...student,
      grades: student.student_id === studentId 
        ? student.grades.map(grade => 
            grade.subject_id === subjectId 
              ? { ...grade, grade_value: value }
              : grade
          )
        : student.grades
    })));
  };

  const handleSaveGrades = async () => {
    if (!selectedCourse || !selectedSubject) {
      setError('Debe seleccionar un curso y una asignatura');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // TODO: Implementar guardado real de calificaciones
      // Por ahora simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "¡Calificaciones guardadas!",
        description: "Las calificaciones se han guardado correctamente.",
        duration: 3000,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar calificaciones';
      setError(errorMessage);
      toast({
        title: "Error al guardar",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selector de Curso y Asignatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Selección de Curso y Asignatura
          </CardTitle>
          <CardDescription>
            Seleccione el curso y la asignatura para gestionar las calificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Curso */}
            <div className="space-y-2">
              <Label htmlFor="course-select">Curso</Label>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger id="course-select">
                  <SelectValue placeholder="Seleccione un curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {course.es_profesor_jefe ? (
                            <Award className="h-4 w-4 text-blue-500" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-green-500" />
                          )}
                          <span>{course.nombre_curso}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {course.estudiantes_activos}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Información del curso seleccionado */}
              {currentCourse && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={currentCourse.es_profesor_jefe ? "default" : "secondary"}>
                    {currentCourse.es_profesor_jefe ? "Profesor Jefe" : "Profesor de Asignatura"}
                  </Badge>
                  <Badge variant="outline">
                    {currentCourse.estudiantes_activos} estudiantes
                  </Badge>
                  <Badge variant="outline">
                    {currentCourse.asignaturas.length} asignatura{currentCourse.asignaturas.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>

            {/* Selector de Asignatura */}
            <div className="space-y-2">
              <Label htmlFor="subject-select">Asignatura</Label>
              <Select 
                value={selectedSubject} 
                onValueChange={handleSubjectChange}
                disabled={!currentCourse || currentCourse.asignaturas.length === 0}
              >
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Seleccione una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {currentCourse?.asignaturas.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{subject.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Nota explicativa */}
              {currentCourse && currentCourse.es_profesor_jefe && (
                <div className="text-xs text-muted-foreground">
                  💡 Como profesor jefe, puede calificar todas las asignaturas del curso
                </div>
              )}
              {currentCourse && !currentCourse.es_profesor_jefe && (
                <div className="text-xs text-muted-foreground">
                  📚 Solo puede calificar las asignaturas que imparte en este curso
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa del curso sin asignaturas seleccionadas */}
      {currentCourse && !selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {currentCourse.nombre_curso}
            </CardTitle>
            <CardDescription>
              Información general del curso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{currentCourse.estudiantes_activos}</div>
                <div className="text-sm text-muted-foreground">Estudiantes Activos</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold">{currentCourse.asignaturas.length}</div>
                <div className="text-sm text-muted-foreground">Asignaturas Disponibles</div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-lg font-bold">
                  {currentCourse.es_profesor_jefe ? "Profesor Jefe" : "Profesor de Asignatura"}
                </div>
                <div className="text-sm text-muted-foreground">Su rol en este curso</div>
              </div>
            </div>
            
            {/* Lista de asignaturas disponibles */}
            {currentCourse.asignaturas.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Asignaturas disponibles para calificar:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {currentCourse.asignaturas.map((subject) => (
                    <Badge 
                      key={subject.id} 
                      variant="outline" 
                      className="justify-center cursor-pointer hover:bg-muted"
                      onClick={() => handleSubjectChange(subject.id)}
                    >
                      {subject.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabla de Calificaciones */}
      {currentCourse && selectedSubject && grades.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Calificaciones - {currentCourse.asignaturas.find(a => a.id === selectedSubject)?.nombre}
                </CardTitle>
                <CardDescription>
                  Gestione las calificaciones de los estudiantes del curso {currentCourse.nombre_curso}
                </CardDescription>
              </div>
              <Button 
                onClick={handleSaveGrades} 
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Calificaciones'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Estudiante</TableHead>
                    <TableHead className="w-[120px]">RUT</TableHead>
                    <TableHead className="w-[100px]">N° Matrícula</TableHead>
                    <TableHead className="w-[150px] text-center">Calificación</TableHead>
                    <TableHead className="w-[100px] text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((student) => {
                    const currentGrade = student.grades.find(g => g.subject_id === selectedSubject);
                    const gradeValue = currentGrade?.grade_value;
                    
                    return (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">
                          {student.student_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.student_rut}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.registration_number}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="1.0"
                            max="7.0"
                            step="0.1"
                            value={gradeValue?.toString() || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null;
                              updateGrade(student.student_id, selectedSubject, value);
                            }}
                            className="w-20 text-center"
                            placeholder="--"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {gradeValue ? (
                            <Badge 
                              variant={gradeValue >= 4.0 ? "default" : "destructive"}
                              className="font-mono"
                            >
                              {gradeValue >= 4.0 ? "Aprobado" : "Reprobado"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Sin calificar</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Información del sistema de calificaciones */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>💡 Sistema de Calificaciones Chileno:</strong> 
                Las calificaciones van de 1.0 a 7.0. La nota mínima de aprobación es 4.0. 
                Utilice decimales para mayor precisión (ej: 5.5, 6.2).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay cursos */}
      {courses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No hay cursos disponibles</h3>
            <p className="text-muted-foreground">
              No tiene cursos asignados como profesor jefe o de asignatura para poder calificar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay estudiantes para calificar */}
      {currentCourse && selectedSubject && grades.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No hay estudiantes para calificar</h3>
            <p className="text-muted-foreground">
              No se encontraron estudiantes activos en este curso para la asignatura seleccionada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}