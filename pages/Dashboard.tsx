import React, { useEffect, useState } from 'react';
import { getIncidents } from '../services/db';
import { Incident } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getIncidents();
    setIncidents(data);
    setLoading(false);
  };

  // Process Data helpers
  const getByCourse = () => {
    const counts: {[key: string]: number} = {};
    incidents.forEach(i => {
      counts[i.course] = (counts[i.course] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  };

  const getByType = () => {
    const counts: {[key: string]: number} = {};
    incidents.forEach(i => {
      counts[i.typeName] = (counts[i.typeName] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  };

  const getByMonth = () => {
    const counts: {[key: string]: number} = {};
    incidents.forEach(i => {
        const date = new Date(i.date);
        const monthName = date.toLocaleString('es-ES', { month: 'long' });
        // Capitalize
        const key = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  };

  if (loading) return <div className="text-center p-10">Cargando estadísticas...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 border-b pb-4 border-gray-200">Panel de Control</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Incidents */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Incidencias</h3>
          <p className="text-4xl font-bold text-gray-900 mt-2">{incidents.length}</p>
        </div>
        
        {/* Card 2: Most Common Type */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Tipo más frecuente</h3>
            <p className="text-xl font-bold text-gray-900 mt-2 truncate">
                {getByType().sort((a,b) => b.value - a.value)[0]?.name || "N/A"}
            </p>
        </div>

        {/* Card 3: Active Month */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
             <h3 className="text-gray-500 text-sm font-medium uppercase">Mes con más actividad</h3>
             <p className="text-xl font-bold text-gray-900 mt-2">
                 {getByMonth().sort((a,b) => b.value - a.value)[0]?.name || "N/A"}
             </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Chart 1: By Course */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Incidencias por Curso</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getByCourse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Cantidad" fill="#1e40af" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: By Type */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Incidencias por Tipo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getByType()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getByType().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: By Month */}
        <div className="bg-white p-6 rounded-xl shadow-md lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Incidencias por Mes</h3>
            <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getByMonth()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Incidencias" fill="#f97316" />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;