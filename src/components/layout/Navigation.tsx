import React from 'react';
import { Users, FileText, Calendar, Settings, Workflow } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'patients', label: '患者管理', icon: Users },
    { id: 'treatments', label: '治療計画', icon: FileText },
    { id: 'workflow', label: 'ワークフロー', icon: Workflow },
    { id: 'appointments', label: '予約管理', icon: Calendar },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};