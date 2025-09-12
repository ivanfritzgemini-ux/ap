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
