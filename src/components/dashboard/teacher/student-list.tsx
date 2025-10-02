"use client";

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";
import { parseISO, format as formatDateFn } from 'date-fns';
import { formatRut } from "@/lib/utils";

interface Student {
  id: string;
  registration_number: string;
  rut: string;
  nombres: string;
  apellidos: string;
  curso: string;
  sexo: string;
  es_matricula_actual: boolean;
  enrollment_date: string;
  fecha_retiro?: string;
}

type SortKey = keyof Student;

interface StudentListProps {
  students: Student[];
}

export function StudentList({ students: initialStudents }: StudentListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filters, setFilters] = React.useState({
    showAll: true,
    showActive: false,
    showWithdrawn: false,
    gender: 'all' as 'all' | 'Femenino' | 'Masculino'
  });
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({
    key: 'registration_number',
    direction: 'ascending'
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const filteredStudents = initialStudents.filter(student => {
    // Filtro de búsqueda
    const matchesSearch = student.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.curso?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro de estado
    if (!filters.showAll) {
      if (filters.showActive && !student.es_matricula_actual) return false;
      if (filters.showWithdrawn && !student.fecha_retiro) return false;
    }

    // Filtro de género
    if (filters.gender !== 'all' && student.sexo !== filters.gender) {
      return false;
    }

    return true;
  });

  const sortedStudents = React.useMemo(() => {
    let sortableStudents = [...filteredStudents];
    if (sortConfig !== null) {
      sortableStudents.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (sortConfig.key === 'registration_number') {
          const aNum = parseInt(String(aValue), 10);
          const bNum = parseInt(String(bValue), 10);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortConfig.direction === 'ascending' ? aNum - bNum : bNum - aNum;
          }
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStudents;
  }, [filteredStudents, sortConfig]);

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const formatDate = (d?: string | null) => {
    if (!d) return '-';
    try {
      const dt = parseISO(d);
      return formatDateFn(dt, 'dd/MM/yyyy');
    } catch (e) {
      return d;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:max-w-sm">
          <label htmlFor="student-search" className="sr-only">Buscar estudiantes</label>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="student-search"
            name="student-search"
            type="search"
            placeholder="Buscar por nombre, RUT o curso..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar estudiantes por nombre, RUT o curso"
          />
        </div>          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label htmlFor="student-status" className="font-medium text-sm">Estado:</label>
              <select
                id="student-status"
                name="student-status"
                aria-label="Filtrar por estado del estudiante"
                className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                value={filters.showAll ? 'all' : filters.showActive ? 'active' : 'withdrawn'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({
                    ...prev,
                    showAll: value === 'all',
                    showActive: value === 'active',
                    showWithdrawn: value === 'withdrawn'
                  }));
                }}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="withdrawn">Retirados</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="student-gender" className="font-medium text-sm">Género:</label>
              <select
                id="student-gender"
                name="student-gender"
                aria-label="Filtrar por género del estudiante"
                className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                value={filters.gender}
                onChange={(e) => {
                  setFilters(prev => ({
                    ...prev,
                    gender: e.target.value as typeof filters.gender
                  }));
                }}
              >
                <option value="all">Todos</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </div>
          </div>
        </div>

        {/* Muestra los filtros activos */}
        <div className="flex flex-wrap gap-2">
          {!filters.showAll && (
            <Badge variant="outline">
              Estado: {filters.showActive ? 'Activos' : 'Retirados'}
            </Badge>
          )}
          {filters.gender !== 'all' && (
            <Badge variant="outline">
              Género: {filters.gender}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabla para desktop */}
      <div className="border rounded-lg mt-4 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell w-24 px-2">
                <Button variant="ghost" onClick={() => requestSort('registration_number')}>
                  N° Reg.
                  {getSortIndicator('registration_number')}
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell px-2">
                <Button variant="ghost" onClick={() => requestSort('rut')}>
                  RUT
                  {getSortIndicator('rut')}
                </Button>
              </TableHead>
              <TableHead className="px-2">
                <Button variant="ghost" onClick={() => requestSort('apellidos')}>
                  Alumno
                  {getSortIndicator('apellidos')}
                </Button>
              </TableHead>
              <TableHead className="px-2">
                <Button variant="ghost" onClick={() => requestSort('curso')}>
                  Curso
                  {getSortIndicator('curso')}
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell px-2">
                <Button variant="ghost" onClick={() => requestSort('enrollment_date')}>
                  F. Matrícula
                  {getSortIndicator('enrollment_date')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="hidden md:table-cell px-2">{student.registration_number}</TableCell>
                <TableCell className="hidden md:table-cell px-2">{formatRut(student.rut)}</TableCell>
                <TableCell className="font-medium px-2">
                  <div className="flex items-center gap-2">
                    <div className={student.fecha_retiro ? 'line-through opacity-60' : ''}>
                      {`${student.apellidos} ${student.nombres}`}
                    </div>
                    {student.fecha_retiro && <Badge variant="destructive">Retirado</Badge>}
                  </div>
                </TableCell>
                <TableCell className="px-2">{student.curso}</TableCell>
                <TableCell className="hidden lg:table-cell px-2">{formatDate(student.enrollment_date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cards para mobile */}
      <div className="grid gap-4 md:hidden mt-4">
        {currentStudents.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className={student.fecha_retiro ? 'line-through opacity-60' : ''}>
                  {`${student.apellidos} ${student.nombres}`}
                </div>
                {student.fecha_retiro && <Badge variant="destructive">Retirado</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-semibold">N° de Registro:</span> {student.registration_number}</p>
              <p><span className="font-semibold">RUT:</span> {formatRut(student.rut)}</p>
              <p><span className="font-semibold">Curso:</span> {student.curso}</p>
              <p><span className="font-semibold">Fecha de Matrícula:</span> {formatDate(student.enrollment_date)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedStudents.length)} de {sortedStudents.length} estudiantes
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </>
  );
}