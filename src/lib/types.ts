export type Role = 'administrator' | 'teacher' | 'student' | 'parent' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  registrationNumber?: string;
  rut?: string;
  gender?: 'Masculino' | 'Femenino';
  course?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  foto_perfil?: string;
}

export interface Course {
    id: string;
    name?: string;
    nombre_curso?: string;  // Para la API de cursos
    teachingType?: string;
    headTeacher?: string;
    studentCount?: number;
}

export interface Student {
  id: string;
  registration_number: string;
  rut: string;
  nombres: string;
  apellidos: string;
  curso: string;
  sexo: string;
  email: string;
  enrollment_date: string;
  fecha_retiro?: string;
  motivo_retiro?: string;
}

export interface Asignatura {
  id: string;
  curso_asignatura_id?: string; // ID de la relación para operaciones
  nombre: string;
  descripcion?: string;
  curso: {
    id: string;
    nombre: string;
  } | null;
  profesor: {
    id: string;
    nombre: string;
    email: string;
  } | null;
}

export interface Teacher {
  id: string;
  nombre: string;
  email: string;
  especialidad?: string;
}
