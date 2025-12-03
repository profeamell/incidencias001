import React, { useState, useEffect } from 'react';
import { getIncidents, getStudents } from '../services/db';
import { Incident, Student } from '../types';
import { SCHOOL_NAME, APP_NAME } from '../constants';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Filters
  const [filterType, setFilterType] = useState<'student' | 'course' | 'school'>('school');
  const [filterPeriod, setFilterPeriod] = useState<string>('all'); // 'all' or 1,2,3,4
  const [filterValue, setFilterValue] = useState<string>(''); // Student ID or Course Name

  useEffect(() => {
    const load = async () => {
        const [inc, stu] = await Promise.all([getIncidents(), getStudents()]);
        setIncidents(inc);
        setStudents(stu);
    };
    load();
  }, []);

  // Calcular cursos disponibles dinámicamente
  const availableCourses = Array.from(new Set(students.map(s => s.course)))
    .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }));

  // Filter Logic
  const getFilteredData = () => {
    let data = incidents;

    // 1. Period Filter
    if (filterPeriod !== 'all') {
        data = data.filter(i => i.period === Number(filterPeriod));
    }

    // 2. Main Criteria
    if (filterType === 'student') {
        if (!filterValue) return [];
        data = data.filter(i => i.studentId === filterValue);
    } else if (filterType === 'course') {
        if (!filterValue) return [];
        data = data.filter(i => i.course === filterValue);
    }
    // 'school' takes all data (already filtered by period)

    return data;
  };

  const results = getFilteredData();

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(SCHOOL_NAME, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(APP_NAME, 14, 28);
    
    doc.setFontSize(10);
    doc.text(`Reporte de Incidencias - Generado: ${new Date().toLocaleDateString()}`, 14, 34);
    
    // Filter Info
    let filterText = `Filtro: `;
    if (filterType === 'school') filterText += 'Toda la institución';
    if (filterType === 'course') filterText += `Curso ${filterValue}`;
    if (filterType === 'student') {
        const s = students.find(st => st.id === filterValue);
        filterText += `Estudiante: ${s?.fullName || 'Desconocido'}`;
    }
    filterText += ` | Periodo: ${filterPeriod === 'all' ? 'Todos' : filterPeriod}`;
    
    doc.text(filterText, 14, 40);

    // Table
    autoTable(doc, {
        startY: 45,
        head: [['Fecha', 'Estudiante', 'Curso', 'Tipo', 'Periodo', 'Docente', 'Seguim.']],
        body: results.map(row => [
            row.date,
            row.studentName,
            row.course,
            row.typeName,
            row.period,
            row.teacherName,
            row.hasFollowUp ? 'SI' : 'NO'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] }, // Blue 800
        styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save('reporte_incidencias.pdf');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Consultas y Reportes</h2>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* 1. Filter Type */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Consulta</label>
                <select
                    value={filterType}
                    onChange={(e) => {
                        setFilterType(e.target.value as any);
                        setFilterValue('');
                    }}
                    className="w-full rounded border-gray-300 py-2 px-3 bg-white text-gray-900 border"
                >
                    <option value="school">Toda la Institución</option>
                    <option value="course">Por Curso</option>
                    <option value="student">Por Estudiante</option>
                </select>
            </div>

            {/* 2. Specific Value (Conditional) */}
            {filterType === 'student' && (
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Buscar Estudiante</label>
                    <select 
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full rounded border-gray-300 py-2 px-3 bg-white text-gray-900 border"
                    >
                        <option value="">Seleccione...</option>
                        {students.sort((a,b) => a.fullName.localeCompare(b.fullName)).map(s => (
                            <option key={s.id} value={s.id}>{s.fullName} ({s.course})</option>
                        ))}
                    </select>
                </div>
            )}

            {filterType === 'course' && (
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Seleccionar Curso</label>
                    <select 
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full rounded border-gray-300 py-2 px-3 bg-white text-gray-900 border"
                    >
                        <option value="">Seleccione...</option>
                        {availableCourses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            )}

            {/* 3. Period */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Periodo</label>
                <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full rounded border-gray-300 py-2 px-3 bg-white text-gray-900 border"
                >
                    <option value="all">Todos los Periodos</option>
                    <option value="1">Periodo 1</option>
                    <option value="2">Periodo 2</option>
                    <option value="3">Periodo 3</option>
                    <option value="4">Periodo 4</option>
                </select>
            </div>

            {/* 4. Action */}
            <div>
                <button
                    onClick={generatePDF}
                    disabled={results.length === 0}
                    className={`w-full flex items-center justify-center py-2 px-4 rounded font-bold text-white transition-colors ${results.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                </button>
            </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Resultados ({results.length})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seg.</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {results.length > 0 ? (
                        results.map((incident) => (
                            <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{incident.studentName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.course}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.typeName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.period}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.teacherName}</td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={incident.description}>{incident.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {incident.hasFollowUp ? (
                                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-bold">SI</span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">NO</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                No se encontraron incidencias con los filtros seleccionados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;