import React from 'react';
import { Home, FilePlus, FileText, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { User, UserRole } from '../types';
import { LOGO_URL, APP_NAME, SCHOOL_NAME } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center w-full px-6 py-3 transition-colors ${
        currentPage === page 
          ? 'bg-primary text-white border-r-4 border-white' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-secondary text-white shadow-xl">
        <div className="p-6 flex flex-col items-center border-b border-gray-700">
          <img src={LOGO_URL} alt="Logo" className="w-16 h-16 mb-3 object-contain" />
          <h1 className="text-lg font-bold text-center leading-tight">{APP_NAME}</h1>
          <p className="text-xs text-gray-400 text-center mt-1">{SCHOOL_NAME}</p>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto">
          <NavItem page="dashboard" icon={Home} label="Dashboard" />
          <NavItem page="incidents" icon={FilePlus} label="Registrar Incidencia" />
          <NavItem page="reports" icon={FileText} label="Consultas y Reportes" />
          {user?.role === UserRole.ADMIN && (
            <NavItem page="admin" icon={Settings} label="Administración" />
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
              {user?.fullName.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.role === UserRole.ADMIN ? 'Administrador' : 'Docente'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm text-red-300 bg-red-900/20 rounded-lg hover:bg-red-900/40 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-secondary text-white p-4 flex justify-between items-center shadow-md z-20">
            <div className="flex items-center">
                <img src={LOGO_URL} alt="Logo" className="w-8 h-8 mr-2" />
                <span className="font-bold">{APP_NAME}</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
             <div className="fixed inset-0 z-10 bg-secondary pt-16 md:hidden">
                 <nav className="p-4">
                    <NavItem page="dashboard" icon={Home} label="Dashboard" />
                    <NavItem page="incidents" icon={FilePlus} label="Registrar Incidencia" />
                    <NavItem page="reports" icon={FileText} label="Consultas y Reportes" />
                    {user?.role === UserRole.ADMIN && (
                        <NavItem page="admin" icon={Settings} label="Administración" />
                    )}
                    <button 
                        onClick={onLogout}
                        className="flex items-center w-full px-6 py-3 mt-4 text-red-400 hover:bg-gray-800"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Cerrar Sesión
                    </button>
                 </nav>
             </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;