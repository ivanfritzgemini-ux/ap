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
}

export interface Course {
    id: string;
    name: string;
    teachingType: string;
    headTeacher: string;
    studentCount: number;
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
}
