import React, { useState } from 'react';
import { LOGO_URL, SCHOOL_NAME, APP_NAME, DEFAULT_ADMIN_USER } from '../constants';
import { User } from '../types';
import { getUsers } from '../services/db';

interface Props {
  onLogin: (user: User) => void;
  showNotification: (msg: string, type: 'error' | 'success') => void;
}

const Login: React.FC<Props> = ({ onLogin, showNotification }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. LLAVE MAESTRA (Bypass de Base de Datos)
    // Esto asegura que el admin SIEMPRE pueda entrar, incluso si Firebase falla o no hay internet.
    if (username === DEFAULT_ADMIN_USER.username && password === DEFAULT_ADMIN_USER.password) {
      setTimeout(() => {
        onLogin(DEFAULT_ADMIN_USER);
      }, 500);
      return;
    }

    try {
      const users = await getUsers();
      // Verificación normal contra base de datos
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        onLogin(user);
      } else {
        showNotification('Credenciales inválidas. Intente nuevamente.', 'error');
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error", error);
      // Fallback final: Si la BD falla pero las credenciales son las del admin por defecto, dejar pasar
      if (username === DEFAULT_ADMIN_USER.username && password === DEFAULT_ADMIN_USER.password) {
        onLogin(DEFAULT_ADMIN_USER);
      } else {
        showNotification('Error de conexión. Si es la primera vez, use admin / 321456', 'error');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">
        
        <div className="w-full p-8 md:p-10">
          <div className="text-center mb-8">
            <img 
              src={LOGO_URL} 
              alt="Logo" 
              className="w-24 h-24 mx-auto mb-4 object-contain"
            />
            <h2 className="text-2xl font-bold text-gray-800">{SCHOOL_NAME}</h2>
            <p className="text-primary font-semibold mt-1">{APP_NAME}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900 transition-all"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900 transition-all"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-800'
              }`}
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>&copy; {new Date().getFullYear()} Sistema de Gestión Escolar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;