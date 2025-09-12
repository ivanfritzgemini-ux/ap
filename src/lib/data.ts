import type { User, Course } from './types';

export const users: User[] = [
  {
    id: 'usr_1',
    name: 'Admin User',
    email: 'admin@campusconnect.com',
    role: 'administrator',
    rut: '11.111.111-1',
    gender: 'Masculino',
  },
  {
    id: 'usr_2',
    name: 'John Teacher',
    email: 'john.t@campusconnect.com',
    role: 'teacher',
    rut: '22.222.222-2',
    gender: 'Masculino',
  },
  {
    id: 'usr_3',
    name: 'Jane Student',
    email: 'jane.s@campusconnect.com',
    role: 'student',
    registrationNumber: '2023001',
    rut: '12.345.678-9',
    gender: 'Femenino',
    course: '1° Medio A'
  },
  {
    id: 'usr_4',
    name: 'Peter Parent',
    email: 'peter.p@campusconnect.com',
    role: 'parent',
    rut: '33.333.333-3',
    gender: 'Masculino',
  },
   {
    id: 'usr_5',
    name: 'Emily Teacher',
    email: 'emily.t@campusconnect.com',
    role: 'teacher',
    rut: '44.444.444-4',
    gender: 'Femenino',
  },
  {
    id: 'usr_6',
    name: 'Michael Student',
    email: 'michael.s@campusconnect.com',
    role: 'student',
    registrationNumber: '2023002',
    rut: '23.456.789-K',
    gender: 'Masculino',
    course: '2° Medio C'
  },
  {
    id: 'usr_7',
    name: 'Diana Miller',
    email: 'diana.m@campusconnect.com',
    role: 'student',
    registrationNumber: '2023003',
    rut: '11.222.333-4',
    gender: 'Femenino',
    course: '1° Medio A'
  }
];

export const courses: Course[] = [
    {
        id: 'cur_1',
        name: '1° Medio A',
        teachingType: 'Científico Humanista',
        headTeacher: 'John Teacher',
        studentCount: 2,
    },
    {
        id: 'cur_2',
        name: '2° Medio C',
        teachingType: 'Científico Humanista',
        headTeacher: 'Emily Teacher',
        studentCount: 1,
    },
    {
        id: 'cur_3',
        name: '3° Medio B - TP',
        teachingType: 'Técnico Profesional',
        headTeacher: 'John Teacher',
        studentCount: 0,
    },
    {
        id: 'cur_4',
        name: '4° Medio A',
        teachingType: 'Científico Humanista',
        headTeacher: 'Emily Teacher',
        studentCount: 0,
    }
];
