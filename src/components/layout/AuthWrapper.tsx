import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from '../auth/LoginForm';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  return <>{children}</>;
};