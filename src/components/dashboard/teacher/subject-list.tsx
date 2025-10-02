"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Book, Users, GraduationCap, Search, Filter, X } from "lucide-react";
import type { TeacherSubject } from "@/lib/data";

interface SubjectListProps {
  subjects: TeacherSubject[];
}

export function SubjectList({ subjects }: SubjectListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByLevel, setFilterByLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "students" | "courses">("name");
  
  // Obtener niveles únicos para el filtro
  const uniqueLevels = Array.from(new Set(
    subjects.flatMap(subject => 
      subject.cursos.map(curso => curso.nivel.toString())
    )
  )).sort();

  // Filtrar y ordenar asignaturas
  const filteredAndSortedSubjects = subjects
    .filter(subject => {
      const matchesSearch = subject.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          subject.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = filterByLevel === "all" || 
                          subject.cursos.some(curso => curso.nivel.toString() === filterByLevel);
      
      return matchesSearch && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "students":
          return b.total_estudiantes - a.total_estudiantes;
        case "courses":
          return b.cursos.length - a.cursos.length;
        case "name":
        default:
          return a.nombre.localeCompare(b.nombre);
      }
    });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterByLevel("all");
    setSortBy("name");
  };

  return (
    <div className="space-y-6">
      {/* Controles de filtro y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar asignatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por nivel */}
            <Select value={filterByLevel} onValueChange={setFilterByLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los niveles</SelectItem>
                {uniqueLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}º Medio
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenar por */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "name" | "students" | "courses")}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nombre A-Z</SelectItem>
                <SelectItem value="students">Más estudiantes</SelectItem>
                <SelectItem value="courses">Más cursos</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          </div>

          {/* Resumen de filtros */}
          {(searchTerm || filterByLevel !== "all" || sortBy !== "name") && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Filtros activos:</span>
                {searchTerm && (
                  <Badge variant="secondary">Búsqueda: "{searchTerm}"</Badge>
                )}
                {filterByLevel !== "all" && (
                  <Badge variant="secondary">Nivel: {filterByLevel}º</Badge>
                )}
                {sortBy !== "name" && (
                  <Badge variant="secondary">
                    Orden: {sortBy === "students" ? "Estudiantes" : "Cursos"}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {filteredAndSortedSubjects.length} Asignatura{filteredAndSortedSubjects.length !== 1 ? 's' : ''}
            {filteredAndSortedSubjects.length !== subjects.length && (
              <span className="text-muted-foreground ml-2">
                (de {subjects.length} total)
              </span>
            )}
          </h3>
        </div>

        {filteredAndSortedSubjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron asignaturas</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm || filterByLevel !== "all" 
                  ? "Intenta ajustar tus filtros de búsqueda"
                  : "No hay asignaturas que coincidan con tu búsqueda"
                }
              </p>
              {(searchTerm || filterByLevel !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedSubjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{subject.nombre}</CardTitle>
                      {subject.descripcion && (
                        <CardDescription className="text-sm">
                          {subject.descripcion}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {subject.cursos.length} {subject.cursos.length === 1 ? 'curso' : 'cursos'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Estadística de estudiantes */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Total Estudiantes</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {subject.total_estudiantes}
                    </span>
                  </div>

                  {/* Lista de cursos */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Cursos:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {subject.cursos.map((curso) => {
                        let nombreCurso = '';
                        if (curso.tipo_educacion?.toLowerCase().includes('enseñanza media técnico')) {
                          nombreCurso = `${curso.nivel}º Medio TP ${curso.letra}`;
                        } else if (curso.tipo_educacion?.toLowerCase().includes('educación media')) {
                          nombreCurso = `${curso.nivel}º Medio ${curso.letra}`;
                        } else {
                          nombreCurso = `${curso.nivel}º ${curso.letra}`;
                        }

                        return (
                          <div 
                            key={curso.id}
                            className="flex items-center justify-between p-2 border rounded-md bg-background"
                          >
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">{nombreCurso}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {curso.estudiantes_activos} estudiantes
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Acciones rápidas por asignatura */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Book className="h-3 w-3 mr-1" />
                      Calificaciones
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Users className="h-3 w-3 mr-1" />
                      Estudiantes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}