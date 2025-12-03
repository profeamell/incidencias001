import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { NotificationState } from '../types';

interface Props {
  notification: NotificationState;
  onClose: () => void;
}

const Notification: React.FC<Props> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification.show) return null;

  const bgColors = {
    success: 'bg-green-100 border-green-500 text-green-900',
    error: 'bg-red-100 border-red-500 text-red-900',
    info: 'bg-blue-100 border-blue-500 text-blue-900',
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-green-600" />,
    error: <XCircle className="w-6 h-6 text-red-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 border-l-4 rounded shadow-lg animate-fade-in-down ${bgColors[notification.type]}`}>
      <div className="mr-3">
        {icons[notification.type]}
      </div>
      <div className="flex-1 mr-2">
        <p className="font-bold text-sm">{notification.type === 'error' ? 'Error' : notification.type === 'success' ? 'Éxito' : 'Información'}</p>
        <p className="text-sm">{notification.message}</p>
      </div>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 ml-2">
        <span className="text-xl">&times;</span>
      </button>
    </div>
  );
};

export default Notification;