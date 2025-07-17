import React, { useState } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Dental Flow
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <UserCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {currentUser.displayName || currentUser.email}
                  </span>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ログアウト</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ログアウト確認
            </h3>
            <p className="text-gray-600 mb-6">
              ログアウトしますか？
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isLoggingOut}
              >
                キャンセル
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};