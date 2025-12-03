

import { User, Student, Teacher, IncidentType, Incident, UserRole } from '../types';
import { DEFAULT_ADMIN_USER } from '../constants';
import * as firebaseApp from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  writeBatch, 
  where, 
  Firestore
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
// INSTRUCCIONES:
// 1. Ve a Configuración del Proyecto en Firebase Console.
// 2. Copia el objeto 'firebaseConfig'.
// 3. Reemplaza los valores de abajo con los tuyos.

const firebaseConfig = {
  apiKey: "AIzaSyB_RTQVrheYBRJP3pwR31ebxc99qn-YE4E",
  authDomain: "incidencias-62509.firebaseapp.com",
  projectId: "incidencias-62509",
  storageBucket: "incidencias-62509.firebasestorage.app",
  messagingSenderId: "970146516550",
  appId: "1:970146516550:web:497238dec17f4dd48b8447",
  measurementId: "G-3CY04NS19N"
};

// --- LÓGICA DE DETECCIÓN DE MODO ---
// Si las credenciales siguen siendo las de ejemplo, usamos modo local para que la app no falle al probar.
const isFirebaseConfigured = firebaseConfig.apiKey !== "TU_API_KEY_AQUI" && !firebaseConfig.projectId.includes("TU_PROJECT_ID");

let db: Firestore;

if (isFirebaseConfigured) {
  try {
    const app = firebaseApp.initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
  }
}

// Nombres de colecciones / Claves de LocalStorage
const COLL_USERS = 'users';
const COLL_STUDENTS = 'students';
const COLL_TEACHERS = 'teachers';
const COLL_TYPES = 'incident_types';
const COLL_INCIDENTS = 'incidents';

// --- UTILS LOCAL STORAGE (FALLBACK) ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const getLocal = (key: string) => JSON.parse(localStorage.getItem(`inselpa_${key}`) || '[]');
const setLocal = (key: string, data: any[]) => localStorage.setItem(`inselpa_${key}`, JSON.stringify(data));

// Función crítica para Firebase: Convierte undefined a null
const cleanPayload = (data: any) => {
  const cleaned: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      cleaned[key] = null;
    } else {
      cleaned[key] = data[key];
    }
  });
  return cleaned;
};

// Fallback user getter for errors
const getLocalUsers = async () => {
    await delay(300);
    let users = getLocal(COLL_USERS);
    if (users.length === 0) {
        users = [DEFAULT_ADMIN_USER];
        setLocal(COLL_USERS, users);
    }
    return users;
};

export const initDB = () => {
  if (isFirebaseConfigured) {
    console.log('%c Inselpa App: Conectado a Google Firebase Firestore ', 'background: #222; color: #bada55');
  } else {
    console.warn('%c Inselpa App: MODO LOCAL ACTIVADO. Edite services/db.ts y pegue sus credenciales de Firebase.', 'background: #fff3cd; color: #856404; font-size: 12px; padding: 4px;');
  }
};

// --- HELPER GENÉRICO FIREBASE ---
const mapDocs = (snapshot: any) => {
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  if (isFirebaseConfigured) {
    try {
      const querySnapshot = await getDocs(collection(db, COLL_USERS));
      const users = mapDocs(querySnapshot) as User[];
      if (users.length === 0) {
        // Crear admin por defecto si está vacío
        try {
            await saveUser(DEFAULT_ADMIN_USER);
            return [DEFAULT_ADMIN_USER];
        } catch (innerError) {
            console.warn("No se pudo crear admin por defecto en Firebase (Probablemente permisos). Usando local.");
            return [DEFAULT_ADMIN_USER];
        }
      }
      return users;
    } catch (e: any) {
      console.error("Error Firebase Users:", e);
      // Si el error es de permisos o conexión, usar local para permitir el login de emergencia
      if (e.code === 'permission-denied' || e.code === 'unavailable') {
          console.warn("Fallo de permisos en Firebase. Usando fallback local.");
          return getLocalUsers();
      }
      return [];
    }
  } else {
    return getLocalUsers();
  }
};

export const saveUser = async (user: User): Promise<void> => {
  if (isFirebaseConfigured) {
    const { id, ...userData } = user;
    const payload = cleanPayload(userData);
    
    if (id && id.length > 5 && !id.startsWith('admin-')) {
      await updateDoc(doc(db, COLL_USERS, id), payload);
    } else {
      // Check duplicate
      const q = query(collection(db, COLL_USERS), where("username", "==", user.username));
      const snap = await getDocs(q);
      if (!snap.empty) {
          const existingId = snap.docs[0].id;
          await updateDoc(doc(db, COLL_USERS, existingId), payload);
      } else {
          await addDoc(collection(db, COLL_USERS), payload);
      }
    }
  } else {
    await delay(500);
    const users = getLocal(COLL_USERS);
    const existingIndex = users.findIndex((u: User) => u.id === user.id);
    if (existingIndex >= 0) {
        users[existingIndex] = user;
    } else {
        users.push({ ...user, id: `user-${Date.now()}` });
    }
    setLocal(COLL_USERS, users);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, COLL_USERS, id));
  } else {
    await delay(300);
    let users = getLocal(COLL_USERS);
    users = users.filter((u: User) => u.id !== id);
    setLocal(COLL_USERS, users);
  }
};

// --- STUDENTS ---
export const getStudents = async (): Promise<Student[]> => {
  if (isFirebaseConfigured) {
    try {
        const snapshot = await getDocs(collection(db, COLL_STUDENTS));
        const list = mapDocs(snapshot) as Student[];
        return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } catch (e) {
        console.error("Firebase Error (Students):", e);
        return getLocal(COLL_STUDENTS).sort((a: Student, b: Student) => a.fullName.localeCompare(b.fullName));
    }
  } else {
    await delay(300);
    const list = getLocal(COLL_STUDENTS);
    return list.sort((a: Student, b: Student) => a.fullName.localeCompare(b.fullName));
  }
};

export const saveStudent = async (student: Student): Promise<void> => {
  if (isFirebaseConfigured) {
    const { id, ...data } = student;
    const payload = cleanPayload(data);

    if (id && id.length > 5 && !id.startsWith('temp-')) {
      await updateDoc(doc(db, COLL_STUDENTS, id), payload);
    } else {
      await addDoc(collection(db, COLL_STUDENTS), payload);
    }
  } else {
    await delay(300);
    const list = getLocal(COLL_STUDENTS);
    const idx = list.findIndex((s: Student) => s.id === student.id);
    if (idx >= 0) list[idx] = student;
    else list.push({ ...student, id: `stu-${Date.now()}` });
    setLocal(COLL_STUDENTS, list);
  }
};

export const deleteStudent = async (id: string): Promise<void> => {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, COLL_STUDENTS, id));
  } else {
    await delay(300);
    let list = getLocal(COLL_STUDENTS);
    list = list.filter((s: Student) => s.id !== id);
    setLocal(COLL_STUDENTS, list);
  }
};

export const importStudents = async (students: Student[]): Promise<void> => {
  if (isFirebaseConfigured) {
    const batchSize = 450; 
    const chunks = [];
    for (let i = 0; i < students.length; i += batchSize) {
        chunks.push(students.slice(i, i + batchSize));
    }
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(student => {
            const docRef = doc(collection(db, COLL_STUDENTS));
            batch.set(docRef, cleanPayload({ 
                fullName: student.fullName, 
                course: student.course 
            }));
        });
        await batch.commit();
    }
  } else {
    await delay(1000);
    const current = getLocal(COLL_STUDENTS);
    const newStudents = students.map((s, i) => ({ ...s, id: `imp-${Date.now()}-${i}` }));
    setLocal(COLL_STUDENTS, [...current, ...newStudents]);
  }
};

// --- TEACHERS ---
export const getTeachers = async (): Promise<Teacher[]> => {
  if (isFirebaseConfigured) {
    try {
        const snapshot = await getDocs(collection(db, COLL_TEACHERS));
        return mapDocs(snapshot) as Teacher[];
    } catch (e) {
        return getLocal(COLL_TEACHERS);
    }
  } else {
    await delay(300);
    return getLocal(COLL_TEACHERS);
  }
};

export const saveTeacher = async (teacher: Teacher): Promise<void> => {
  if (isFirebaseConfigured) {
    const { id, ...data } = teacher;
    const payload = cleanPayload(data);

    if (id && id.length > 5) {
       await updateDoc(doc(db, COLL_TEACHERS, id), payload);
    } else {
       await addDoc(collection(db, COLL_TEACHERS), payload);
    }
  } else {
    await delay(300);
    const list = getLocal(COLL_TEACHERS);
    const idx = list.findIndex((t: Teacher) => t.id === teacher.id);
    if (idx >= 0) list[idx] = teacher;
    else list.push({ ...teacher, id: `teach-${Date.now()}` });
    setLocal(COLL_TEACHERS, list);
  }
};

export const deleteTeacher = async (id: string): Promise<void> => {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, COLL_TEACHERS, id));
  } else {
    await delay(300);
    let list = getLocal(COLL_TEACHERS);
    list = list.filter((t: Teacher) => t.id !== id);
    setLocal(COLL_TEACHERS, list);
  }
};

// --- INCIDENT TYPES ---
export const getIncidentTypes = async (): Promise<IncidentType[]> => {
  if (isFirebaseConfigured) {
    try {
        const snapshot = await getDocs(collection(db, COLL_TYPES));
        return mapDocs(snapshot) as IncidentType[];
    } catch (e) {
        return getLocal(COLL_TYPES);
    }
  } else {
    await delay(300);
    return getLocal(COLL_TYPES);
  }
};

export const saveIncidentType = async (type: IncidentType): Promise<void> => {
  if (isFirebaseConfigured) {
    const { id, ...data } = type;
    const payload = cleanPayload(data);

    if (id && id.length > 5) {
      await updateDoc(doc(db, COLL_TYPES, id), payload);
    } else {
      await addDoc(collection(db, COLL_TYPES), payload);
    }
  } else {
    await delay(300);
    const list = getLocal(COLL_TYPES);
    const idx = list.findIndex((t: IncidentType) => t.id === type.id);
    if (idx >= 0) list[idx] = type;
    else list.push({ ...type, id: `type-${Date.now()}` });
    setLocal(COLL_TYPES, list);
  }
};

export const deleteIncidentType = async (id: string): Promise<void> => {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, COLL_TYPES, id));
  } else {
    await delay(300);
    let list = getLocal(COLL_TYPES);
    list = list.filter((t: IncidentType) => t.id !== id);
    setLocal(COLL_TYPES, list);
  }
};

// --- INCIDENTS ---
export const getIncidents = async (): Promise<Incident[]> => {
  if (isFirebaseConfigured) {
    try {
        // Obtenemos todas sin orden estricto de servidor para ordenar en cliente correctamente
        // ya que mezclamos datos con y sin timestamp
        const snapshot = await getDocs(collection(db, COLL_INCIDENTS));
        return mapDocs(snapshot) as Incident[];
    } catch (e) {
        console.error("Firebase Error (Incidents):", e);
        return getLocal(COLL_INCIDENTS);
    }
  } else {
    await delay(300);
    return getLocal(COLL_INCIDENTS);
  }
};

export const saveIncident = async (incident: Incident): Promise<void> => {
  // Aseguramos que tenga fecha de creación para ordenar
  const dataWithTimestamp = {
      ...incident,
      createdAt: Date.now() 
  };

  if (isFirebaseConfigured) {
    const { id, ...data } = dataWithTimestamp;
    const payload = cleanPayload(data);
    await addDoc(collection(db, COLL_INCIDENTS), payload);
  } else {
    await delay(500);
    const list = getLocal(COLL_INCIDENTS);
    list.push({ ...dataWithTimestamp, id: `inc-${Date.now()}` });
    setLocal(COLL_INCIDENTS, list);
  }
};

export const deleteIncident = async (id: string): Promise<void> => {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, COLL_INCIDENTS, id));
  } else {
    await delay(300);
    let list = getLocal(COLL_INCIDENTS);
    list = list.filter((i: Incident) => i.id !== id);
    setLocal(COLL_INCIDENTS, list);
  }
};

// --- RESET YEAR ---
export const clearYearlyData = async (): Promise<void> => {
  if (isFirebaseConfigured) {
    const studSnap = await getDocs(collection(db, COLL_STUDENTS));
    const batch1 = writeBatch(db);
    studSnap.forEach((doc) => batch1.delete(doc.ref));
    await batch1.commit();

    const incSnap = await getDocs(collection(db, COLL_INCIDENTS));
    const batch2 = writeBatch(db);
    incSnap.forEach((doc) => batch2.delete(doc.ref));
    await batch2.commit();
  } else {
    await delay(1000);
    setLocal(COLL_STUDENTS, []);
    setLocal(COLL_INCIDENTS, []);
  }
};
