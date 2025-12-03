
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Only used for verification, not stored in plain text in real app
  fullName: string;
  role: UserRole;
}

export interface Student {
  id: string;
  fullName: string; // Max 45 chars
  course: string; // Max 4 chars
}

export interface Teacher {
  id: string;
  fullName: string;
}

export interface IncidentType {
  id: string;
  name: string;
}

export interface Incident {
  id: string;
  studentId: string;
  studentName: string; // Denormalized for easier reporting
  course: string;
  teacherId: string;
  teacherName: string;
  typeId: string;
  typeName: string;
  period: 1 | 2 | 3 | 4;
  date: string;
  description: string;
  hasFollowUp: boolean; // Si/No
  evidenceUrl?: string; // Base64 or URL
  createdAt?: number; // Timestamp exacto de creación para ordenamiento
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}
