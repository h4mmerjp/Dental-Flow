import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  const Icon = icons[type];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className={`p-4 rounded-lg border ${colors[type]} shadow-lg`}>
        <div className="flex items-start">
          <Icon className={`w-5 h-5 ${iconColors[type]} mr-3 flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const useNotification = () => {
  const [notification, setNotification] = React.useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false,
  });

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
};