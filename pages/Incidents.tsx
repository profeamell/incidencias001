import React, { useState, useEffect } from 'react';
import { getStudents, getTeachers, getIncidentTypes, saveIncident } from '../services/db';
import { Student, Teacher, IncidentType, User } from '../types';
import { Camera, Save } from 'lucide-react';

interface Props {
  user: User;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const Incidents: React.FC<Props> = ({ user, showNotification }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [types, setTypes] = useState<IncidentType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(''); // Who reported it?
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [period, setPeriod] = useState<1|2|3|4>(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [evidence, setEvidence] = useState<string | undefined>(undefined);

  useEffect(() => {
    const init = async () => {
        const [s, t, tp] = await Promise.all([getStudents(), getTeachers(), getIncidentTypes()]);
        setStudents(s);
        setTeachers(t);
        setTypes(tp);
    };
    init();
  }, []);

  // 1. Obtener cursos únicos dinámicamente de los estudiantes existentes
  const availableCourses = Array.from(new Set(students.map(s => s.course)))
    .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));

  // 2. Filtrar estudiantes basado en el curso seleccionado
  const filteredStudents = students
    .filter(s => s.course === selectedCourse)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidence(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setSelectedCourse('');
    setSelectedStudentId('');
    setSelectedTeacherId('');
    setSelectedTypeId('');
    setPeriod(1);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setHasFollowUp(false);
    setEvidence(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedStudentId || !selectedTeacherId || !selectedTypeId || !description) {
        showNotification('Por favor complete todos los campos obligatorios', 'error');
        return;
    }

    setLoading(true);
    try {
        const student = students.find(s => s.id === selectedStudentId);
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        const type = types.find(t => t.id === selectedTypeId);

        if (!student || !teacher || !type) throw new Error("Datos inválidos");

        await saveIncident({
            id: `inc-${Date.now()}`,
            studentId: student.id,
            studentName: student.fullName,
            course: student.course,
            teacherId: teacher.id,
            teacherName: teacher.fullName,
            typeId: type.id,
            typeName: type.name,
            period,
            date,
            description,
            hasFollowUp,
            evidenceUrl: evidence
        });

        showNotification('Incidencia registrada exitosamente', 'success');
        resetForm();
    } catch (err) {
        showNotification('Error al guardar la incidencia', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">📝</span> Registro de Incidencia
            </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Select Course */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Curso</label>
                    <select
                        value={selectedCourse}
                        onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            setSelectedStudentId(''); // Reset student when course changes
                        }}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 px-3 bg-white text-gray-900 border"
                        required
                    >
                        <option value="">Seleccione Curso</option>
                        {availableCourses.length > 0 ? (
                            availableCourses.map(c => <option key={c} value={c}>{c}</option>)
                        ) : (
                            <option value="" disabled>No hay cursos con estudiantes</option>
                        )}
                    </select>
                </div>

                {/* 2. Select Student */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estudiante</label>
                    <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        disabled={!selectedCourse}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 px-3 bg-white text-gray-900 border"
                        required
                    >
                        <option value="">
                            {selectedCourse ? 'Seleccione Estudiante' : 'Primero seleccione un curso'}
                        </option>
                        {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                    </select>
                </div>

                 {/* 3. Reporting Teacher */}
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Docente que reporta</label>
                    <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 px-3 bg-white text-gray-900 border"
                        required
                    >
                        <option value="">Seleccione Docente</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                    </select>
                </div>

                {/* 4. Incident Type */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Incidencia</label>
                    <select
                        value={selectedTypeId}
                        onChange={(e) => setSelectedTypeId(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 px-3 bg-white text-gray-900 border"
                        required
                    >
                        <option value="">Seleccione Tipo</option>
                        {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                {/* 5. Period */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Periodo Académico</label>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value) as 1|2|3|4)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 px-3 bg-white text-gray-900 border"
                        required
                    >
                        {[1, 2, 3, 4].map(p => <option key={p} value={p}>Periodo {p}</option>)}
                    </select>
                </div>

                 {/* 6. Date */}
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 px-3 bg-white text-gray-900 border"
                        required
                    />
                </div>
            </div>

            {/* 7. Description */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observación / Descripción</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 py-2 px-3 bg-white text-gray-900 border"
                    placeholder="Detalles de lo sucedido..."
                    required
                ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                 {/* 8. Follow up (Toggle) */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">¿Requiere Seguimiento?</label>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => setHasFollowUp(true)}
                            className={`px-6 py-2 rounded-full border transition-all ${hasFollowUp ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            SÍ
                        </button>
                        <button
                            type="button"
                            onClick={() => setHasFollowUp(false)}
                            className={`px-6 py-2 rounded-full border transition-all ${!hasFollowUp ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            NO
                        </button>
                    </div>
                </div>

                {/* 9. Evidence (Camera/File) */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Evidencia (Foto)</label>
                    <div className="flex items-center space-x-3">
                        <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors border border-gray-300">
                            <Camera className="w-5 h-5 mr-2" />
                            <span>Subir / Tomar Foto</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment"
                                onChange={handleFileChange}
                                className="hidden" 
                            />
                        </label>
                        {evidence && (
                            <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                                Imagen cargada
                            </span>
                        )}
                    </div>
                    {evidence && (
                        <div className="mt-2 w-24 h-24 rounded overflow-hidden border">
                            <img src={evidence} alt="Evidencia" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className={`flex items-center px-8 py-3 rounded-lg text-white font-bold text-lg shadow-lg transform transition hover:-translate-y-0.5 ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-blue-800'}`}
                >
                    {loading ? (
                        <span>Guardando...</span>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Guardar Incidencia
                        </>
                    )}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};

export default Incidents;