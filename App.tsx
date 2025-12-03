import React, { useState, useEffect } from 'react';
import { User, NotificationState } from './types';
import { initDB } from './services/db';
import Layout from './components/Layout';
import Notification from './components/Notification';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Reports from './pages/Reports';
import AdminPanel from './pages/Admin';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    initDB();
    const storedUser = localStorage.getItem('inselpa_active_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentPage('dashboard');
    }
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
  };

  const handleLogin = (user: User) => {
    setUser(user);
    localStorage.setItem('inselpa_active_user', JSON.stringify(user));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('inselpa_active_user');
    setCurrentPage('login');
  };

  // Routing Logic
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'incidents':
        if (!user) return null;
        return <Incidents user={user} showNotification={showNotification} />;
      case 'reports':
        return <Reports />;
      case 'admin':
        return <AdminPanel showNotification={showNotification} />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} showNotification={showNotification} />
        <Notification notification={notification} onClose={() => setNotification({ ...notification, show: false })} />
      </>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {renderPage()}
      <Notification notification={notification} onClose={() => setNotification({ ...notification, show: false })} />
    </Layout>
  );
};

export default App;