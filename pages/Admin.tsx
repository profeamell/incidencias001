
import React, { useState, useEffect } from 'react';
import { 
  getUsers, saveUser, deleteUser,
  getStudents, saveStudent, deleteStudent, importStudents, clearYearlyData,
  getTeachers, saveTeacher, deleteTeacher,
  getIncidentTypes, saveIncidentType, deleteIncidentType,
  getIncidents, deleteIncident
} from '../services/db';
import { User, Student, Teacher, IncidentType, UserRole, Incident } from '../types';
import { Trash2, Edit, Plus, Upload, AlertTriangle, Database, XCircle, CheckCircle, AlertCircle, FileSpreadsheet, Flame } from 'lucide-react';
// @ts-ignore
import readXlsxFile from 'read-excel-file';

interface Props {
  showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AdminPanel: React.FC<Props> = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'students' | 'teachers' | 'types' | 'incidents' | 'db'>('users');
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'user' | 'student' | 'teacher' | 'type' | 'incident'} | null>(null);
  const [importPreview, setImportPreview] = useState<Student[]>([]);
  const [importFileMetadata, setImportFileMetadata] = useState<{name: string, count: number} | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    try {
        const [u, s, t, ty, inc] = await Promise.all([
            getUsers(), 
            getStudents(), 
            getTeachers(), 
            getIncidentTypes(),
            getIncidents()
        ]);
        setUsers(u || []);
        setStudents(s || []);
        setTeachers(t || []);
        setTypes(ty || []);
        // ORDENAMIENTO ASCENDENTE (Cronológico: 1, 2, 3...)
        // Si tiene createdAt, usa eso. Si no, usa la fecha del incidente.
        setIncidents(inc ? inc.sort((a,b) => {
            if (a.createdAt && b.createdAt) return a.createdAt - b.createdAt;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }) : []); 
    } catch (error) {
        showNotification('Error cargando datos. Verifique configuración de Firebase.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...item });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const promptDelete = (id: string, type: 'user' | 'student' | 'teacher' | 'type' | 'incident') => {
    setItemToDelete({ id, type });
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
        const { id, type } = itemToDelete;
        if (type === 'user') await deleteUser(id);
        if (type === 'student') await deleteStudent(id);
        if (type === 'teacher') await deleteTeacher(id);
        if (type === 'type') await deleteIncidentType(id);
        if (type === 'incident') await deleteIncident(id);
        showNotification('Registro eliminado correctamente', 'success');
        await refreshAll();
    } catch (e) {
        showNotification('Error al eliminar el registro', 'error');
    } finally {
        setLoading(false);
        setItemToDelete(null);
    }
  };

  const saveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await saveUser({
            id: editingId || '',
            username: formData.username,
            password: formData.password,
            fullName: formData.fullName,
            role: formData.role || UserRole.TEACHER
        });
        showNotification('Usuario guardado', 'success');
        handleCancel();
        await refreshAll();
    } catch (e) { showNotification('Error al guardar', 'error'); }
  };

  const saveStudentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fullName.length > 45) {
        showNotification('El nombre no puede exceder 45 caracteres', 'error');
        return;
    }
    setLoading(true);
    try {
        await saveStudent({
            id: editingId || '',
            fullName: formData.fullName,
            course: formData.course
        });
        showNotification('Estudiante guardado', 'success');
        handleCancel();
        await refreshAll();
    } catch (e) { showNotification('Error al guardar', 'error'); }
  };

  const saveTeacherForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await saveTeacher({
            id: editingId || '',
            fullName: formData.fullName
        });
        showNotification('Docente guardado', 'success');
        handleCancel();
        await refreshAll();
    } catch (e) { showNotification('Error al guardar', 'error'); }
  };

  const saveTypeForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await saveIncidentType({
            id: editingId || '',
            name: formData.name
        });
        showNotification('Tipo de incidencia guardado', 'success');
        handleCancel();
        await refreshAll();
    } catch (e) { showNotification('Error al guardar', 'error'); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
        const rows = await readXlsxFile(file);
        const parsedStudents: Student[] = [];
        rows.forEach((row: any[], index: number) => {
             if (!row || row.length < 2) return;
             const col1 = row[0] !== null && row[0] !== undefined ? String(row[0]).trim() : '';
             const col2 = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : '';
             if (!col1 && !col2) return;
             if (index === 0) {
                 const headerSig = (col1 + col2).toLowerCase();
                 if (headerSig.includes('nombre') || headerSig.includes('curso') || headerSig.includes('estudiante')) {
                     return;
                 }
             }
             if (col1) {
                 parsedStudents.push({
                     id: `temp-${index}`, // Temporal ID, Firestore creates real ones
                     fullName: col1.substring(0, 45), 
                     course: col2.substring(0, 4)     
                 });
             }
        });
        if (parsedStudents.length > 0) {
            setImportPreview(parsedStudents);
            setImportFileMetadata({ name: file.name, count: parsedStudents.length });
            showNotification(`Archivo leído correctamente. ${parsedStudents.length} registros válidos encontrados.`, 'success');
        } else {
            showNotification('No se encontraron registros válidos.', 'error');
            setImportPreview([]);
            setImportFileMetadata(null);
        }
    } catch (err) {
        console.error(err);
        showNotification('Error al leer el archivo Excel.', 'error');
    } finally {
        setLoading(false);
        e.target.value = ''; 
    }
  };

  const cancelImport = () => {
    setImportPreview([]);
    setImportFileMetadata(null);
    showNotification('Importación cancelada.', 'info');
  };

  const confirmImport = async () => {
    if (importPreview.length === 0) return;
    setLoading(true);
    try {
        await importStudents(importPreview);
        showNotification(`Se importaron exitosamente ${importPreview.length} estudiantes a Firebase.`, 'success');
        setImportPreview([]);
        setImportFileMetadata(null);
        await refreshAll();
    } catch (e) {
        showNotification('Error al guardar los datos importados.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleResetYear = async () => {
    setLoading(true);
    try {
        await clearYearlyData();
        showNotification('Sistema reseteado para nuevo año escolar (Colecciones limpiadas)', 'success');
        setShowResetConfirm(false);
        await refreshAll();
    } catch (e) { 
        showNotification('Error al resetear', 'error'); 
        setLoading(false);
    }
  };

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
    <button
      onClick={() => { 
          setActiveTab(id); 
          handleCancel(); 
          setShowResetConfirm(false); 
          setItemToDelete(null);
          cancelImport();
      }}
      className={`px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
        activeTab === id 
          ? 'border-primary text-primary' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <h2 className="text-3xl font-bold text-gray-800">Administración</h2>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex overflow-x-auto border-b hide-scrollbar">
          <TabButton id="users" label="Usuarios" />
          <TabButton id="students" label="Estudiantes" />
          <TabButton id="teachers" label="Docentes" />
          <TabButton id="types" label="Tipos Incidencia" />
          <TabButton id="incidents" label="Gestión Incidencias" />
          <TabButton id="db" label="Base de Datos" />
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-6">
               <form onSubmit={saveUserForm} className="bg-gray-50 p-4 rounded-lg border grid gap-4 md:grid-cols-4 items-end">
                   <div className="md:col-span-1">
                       <input 
                            placeholder="Usuario" 
                            className="w-full p-2 border rounded text-gray-900 bg-white" 
                            value={formData.username || ''} 
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            required
                        />
                   </div>
                   <div className="md:col-span-1">
                       <input 
                            type="text" 
                            placeholder="Contraseña" 
                            className="w-full p-2 border rounded text-gray-900 bg-white" 
                            value={formData.password || ''} 
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            required
                        />
                   </div>
                   <div className="md:col-span-1">
                       <input 
                            placeholder="Nombre Completo" 
                            className="w-full p-2 border rounded text-gray-900 bg-white" 
                            value={formData.fullName || ''} 
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                            required
                        />
                   </div>
                   <div className="flex space-x-2">
                       <button type="submit" disabled={loading} className="flex-1 bg-primary text-white p-2 rounded hover:bg-blue-800">
                           {editingId ? 'Actualizar' : 'Crear'}
                       </button>
                       {editingId && <button type="button" onClick={handleCancel} className="bg-gray-300 p-2 rounded">Cancelar</button>}
                   </div>
               </form>

               <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                       <thead><tr className="bg-gray-100 text-gray-600"><th className="p-3">Usuario</th><th className="p-3">Nombre</th><th className="p-3">Rol</th><th className="p-3">Acciones</th></tr></thead>
                       <tbody>
                           {users.map(u => (
                               <tr key={u.id} className="border-b hover:bg-gray-50 text-gray-900">
                                   <td className="p-3">{u.username}</td>
                                   <td className="p-3">{u.fullName}</td>
                                   <td className="p-3">{u.role}</td>
                                   <td className="p-3 flex space-x-2">
                                       <button onClick={() => handleEdit(u)} className="text-blue-600 hover:text-blue-800"><Edit size={18}/></button>
                                       {u.username !== 'admin' && (
                                            <button onClick={() => promptDelete(u.id, 'user')} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                                       )}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
            </div>
          )}

          {activeTab === 'students' && (
             <div className="space-y-6">
                {importPreview.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden animate-fade-in">
                        <div className="bg-blue-100 p-4 border-b border-blue-200 flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center mb-4 md:mb-0">
                                <FileSpreadsheet className="w-8 h-8 text-blue-700 mr-3" />
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900">Vista Previa de Importación</h3>
                                    <p className="text-sm text-blue-800">
                                        Archivo: <span className="font-semibold">{importFileMetadata?.name}</span> | 
                                        Registros: <span className="font-bold bg-white px-2 py-0.5 rounded text-blue-900 ml-1">{importFileMetadata?.count}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={cancelImport} className="flex items-center px-4 py-2 bg-white text-gray-700 rounded shadow border"><XCircle className="w-4 h-4 mr-2" /> Cancelar</button>
                                <button onClick={confirmImport} disabled={loading} className="flex items-center px-4 py-2 bg-green-600 text-white rounded shadow font-bold"><CheckCircle className="w-4 h-4 mr-2" /> Confirmar</button>
                            </div>
                        </div>
                        <div className="p-4 max-h-80 overflow-y-auto">
                            <table className="w-full text-left border-collapse bg-white shadow-sm rounded">
                                <thead className="bg-gray-100 sticky top-0"><tr className="text-gray-700 text-sm"><th className="p-2 border-b">Nombre Estudiante</th><th className="p-2 border-b">Curso</th></tr></thead>
                                <tbody>
                                    {importPreview.map((s, idx) => (
                                        <tr key={idx} className="border-b text-gray-800 text-sm">
                                            <td className="p-2">{s.fullName}</td>
                                            <td className="p-2 font-mono">{s.course}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 flex flex-col items-center justify-center text-center shadow-inner">
                            <Upload className="w-8 h-8 text-primary mb-2" />
                            <h4 className="font-bold text-gray-800 text-lg mb-1">Importar Estudiantes desde Excel</h4>
                            <label className={`cursor-pointer bg-primary text-white px-6 py-2 rounded-full shadow-lg hover:bg-blue-700 mt-2 flex items-center font-semibold ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {loading ? 'Leyendo...' : 'Seleccionar Archivo'}
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" disabled={loading} />
                            </label>
                        </div>
                        <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink-0 mx-4 text-gray-400 text-sm uppercase">O gestión individual</span><div className="flex-grow border-t border-gray-200"></div>
                        </div>
                        <form onSubmit={saveStudentForm} className="bg-gray-50 p-4 rounded-lg border grid gap-4 md:grid-cols-3 items-end">
                            <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre Completo</label><input maxLength={45} className="w-full p-2 border rounded text-gray-900 bg-white" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} required /></div>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Curso</label><input maxLength={4} className="w-full p-2 border rounded text-gray-900 bg-white" value={formData.course || ''} onChange={e => setFormData({...formData, course: e.target.value})} required /></div>
                            <div className="flex space-x-2"><button type="submit" disabled={loading} className="flex-1 bg-secondary text-white p-2 rounded hover:bg-gray-900 font-medium">{editingId ? 'Actualizar' : 'Agregar'}</button>{editingId && <button type="button" onClick={handleCancel} className="bg-gray-300 text-gray-700 p-2 rounded">Cancelar</button>}</div>
                        </form>
                        <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-100 shadow-sm z-10"><tr className="text-gray-600 text-sm uppercase"><th className="p-3">Nombre</th><th className="p-3">Curso</th><th className="p-3">Acciones</th></tr></thead>
                                <tbody className="bg-white">
                                    {students.map(s => (
                                        <tr key={s.id} className="border-b hover:bg-gray-50 text-gray-900 transition-colors">
                                            <td className="p-3 font-medium">{s.fullName}</td>
                                            <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{s.course}</span></td>
                                            <td className="p-3 flex space-x-2">
                                                <button onClick={() => handleEdit(s)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={18}/></button>
                                                <button onClick={() => promptDelete(s.id, 'student')} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
             </div>
          )}

          {activeTab === 'teachers' && (
            <div className="space-y-6">
                <form onSubmit={saveTeacherForm} className="bg-gray-50 p-4 rounded-lg border flex gap-4 items-end">
                   <div className="flex-1"><input placeholder="Nombre Docente" className="w-full p-2 border rounded text-gray-900 bg-white" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} required /></div>
                   <button type="submit" disabled={loading} className="bg-primary text-white p-2 rounded w-32">{editingId ? 'Actualizar' : 'Agregar'}</button>
                   {editingId && <button type="button" onClick={handleCancel} className="bg-gray-300 p-2 rounded">Cancelar</button>}
               </form>
               <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-100 text-gray-600"><th className="p-3">Nombre</th><th className="p-3">Acciones</th></tr></thead><tbody>{teachers.map(t => (<tr key={t.id} className="border-b hover:bg-gray-50 text-gray-900"><td className="p-3">{t.fullName}</td><td className="p-3 flex space-x-2"><button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800"><Edit size={18}/></button><button onClick={() => promptDelete(t.id, 'teacher')} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'types' && (
             <div className="space-y-6">
                <form onSubmit={saveTypeForm} className="bg-gray-50 p-4 rounded-lg border flex gap-4 items-end">
                   <div className="flex-1"><input placeholder="Nombre del Tipo" className="w-full p-2 border rounded text-gray-900 bg-white" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                   <button type="submit" disabled={loading} className="bg-primary text-white p-2 rounded w-32">{editingId ? 'Actualizar' : 'Agregar'}</button>
                   {editingId && <button type="button" onClick={handleCancel} className="bg-gray-300 p-2 rounded">Cancelar</button>}
               </form>
               <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-100 text-gray-600"><th className="p-3">Nombre</th><th className="p-3">Acciones</th></tr></thead><tbody>{types.map(t => (<tr key={t.id} className="border-b hover:bg-gray-50 text-gray-900"><td className="p-3">{t.name}</td><td className="p-3 flex space-x-2"><button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-800"><Edit size={18}/></button><button onClick={() => promptDelete(t.id, 'type')} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'incidents' && (
             <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-900 flex items-center mb-1"><AlertCircle className="w-5 h-5 mr-2"/>Gestión de Incidencias</h3>
                    <p className="text-sm text-blue-800">Eliminación de registros incorrectos. Ordenados por fecha de creación (antiguos primero).</p>
                </div>
                <div className="overflow-x-auto border rounded-lg max-h-[500px] overflow-y-auto">
                   <table className="w-full text-left border-collapse">
                       <thead className="sticky top-0 bg-gray-100 shadow-sm z-10"><tr className="text-gray-600 text-xs uppercase"><th className="p-3">Fecha</th><th className="p-3">Estudiante</th><th className="p-3">Curso</th><th className="p-3">Tipo</th><th className="p-3">Observación</th><th className="p-3">Docente</th><th className="p-3 text-center">Acción</th></tr></thead>
                       <tbody className="bg-white">
                           {incidents.length > 0 ? incidents.map(inc => (
                               <tr key={inc.id} className="border-b hover:bg-gray-50 text-gray-900 transition-colors text-sm">
                                   <td className="p-3 whitespace-nowrap">{inc.date}</td><td className="p-3 font-medium">{inc.studentName}</td><td className="p-3 font-mono">{inc.course}</td><td className="p-3">{inc.typeName}</td>
                                   <td className="p-3 max-w-xs truncate" title={inc.description}>{inc.description}</td>
                                   <td className="p-3">{inc.teacherName}</td>
                                   <td className="p-3 text-center"><button onClick={() => promptDelete(inc.id, 'incident')} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full"><Trash2 size={18}/></button></td>
                               </tr>
                           )) : (<tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay incidencias registradas</td></tr>)}
                       </tbody>
                   </table>
               </div>
            </div>
          )}

          {activeTab === 'db' && (
              <div className="space-y-6">
                  <div className={`border rounded p-6 transition-colors ${showResetConfirm ? 'bg-red-100 border-red-400' : 'bg-red-50 border-red-200'}`}>
                      <h3 className="text-xl font-bold text-red-800 mb-2 flex items-center"><AlertTriangle className="mr-2" /> Zona de Peligro - Fin de Año Escolar</h3>
                      {!showResetConfirm ? (
                        <>
                            <p className="text-red-700 mb-4">Esta acción eliminará permanentemente todos los registros de estudiantes e incidencias de Firebase.</p>
                            <button onClick={() => setShowResetConfirm(true)} disabled={loading} className="bg-red-600 text-white font-bold py-3 px-6 rounded hover:bg-red-700 shadow flex items-center disabled:opacity-50"><Trash2 className="mr-2" /> Iniciar Proceso de Reseteo</button>
                        </>
                      ) : (
                        <div className="animate-fade-in-up">
                            <p className="text-red-900 font-bold mb-4 text-lg">¿ESTÁ COMPLETAMENTE SEGURO?</p>
                            <div className="flex space-x-4">
                                <button onClick={handleResetYear} disabled={loading} className="bg-red-700 text-white font-bold py-3 px-6 rounded hover:bg-red-900 shadow-lg flex items-center disabled:opacity-50">{loading ? 'Eliminando...' : 'SÍ, ELIMINAR TODO'}</button>
                                <button onClick={() => setShowResetConfirm(false)} disabled={loading} className="bg-white text-gray-800 font-bold py-3 px-6 rounded hover:bg-gray-100 border shadow flex items-center"><XCircle className="mr-2" /> Cancelar</button>
                            </div>
                        </div>
                      )}
                  </div>
                  <div className="bg-gray-50 p-6 rounded border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Flame className="mr-2 text-orange-500" />Conexión Google Firebase</h3>
                      <div className="p-4 bg-white rounded border text-sm text-gray-700 space-y-4">
                          <p className="text-green-700 font-bold">¡Conectado a Firebase Firestore!</p>
                          <p>Para configurar tu proyecto:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Ve a <a href="https://console.firebase.google.com" target="_blank" className="text-blue-600 underline">Firebase Console</a>.</li>
                              <li>Crea un proyecto y una base de datos <strong>Firestore</strong>.</li>
                              <li>Configura las reglas como <code>allow read, write: if true;</code> (solo para pruebas).</li>
                              <li>Copia las credenciales en <code>services/db.ts</code>.</li>
                          </ol>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] animate-fade-in p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
                <div className="p-6">
                    <div className="flex items-center mb-4 text-red-600"><AlertCircle className="w-8 h-8 mr-2" /><h3 className="text-xl font-bold">Confirmar Eliminación</h3></div>
                    <p className="text-gray-600 mb-6">¿Está seguro de que desea eliminar este registro permanentemente de Firebase?</p>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setItemToDelete(null)} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 border" disabled={loading}>Cancelar</button>
                        <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md" disabled={loading}>{loading ? 'Eliminando...' : 'Sí, Eliminar'}</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
