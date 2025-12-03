import { UserRole } from './types';

export const LOGO_URL = "https://imgur.com/JYSeHia.png";
export const SCHOOL_NAME = "Institución Educativa la Pascuala";
export const APP_NAME = "Incidencias INSELPA";

export const COURSES = ["601", "602", "701", "702", "801", "802", "901", "902", "1001", "1002", "1101", "1102"];

export const DEFAULT_ADMIN_USER = {
  id: 'admin-001',
  username: 'admin',
  password: '321456', // Actualizado a la contraseña solicitada
  fullName: 'Administrador Principal',
  role: UserRole.ADMIN
};