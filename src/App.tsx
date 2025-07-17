import React, { useState } from 'react';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { AuthWrapper } from './components/layout/AuthWrapper';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { PatientListPage } from './pages/PatientListPage';
import { TreatmentPlansPage } from './pages/TreatmentPlansPage';
import { DentalWorkflowPage } from './pages/DentalWorkflowPage';

function App() {
  const [currentPage, setCurrentPage] = useState('patients');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'patients':
        return <PatientListPage />;
      case 'treatments':
        return <TreatmentPlansPage />;
      case 'workflow':
        return <DentalWorkflowPage />;
      case 'appointments':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">予約管理</h2>
              <p className="text-gray-600">予約管理機能は開発中です</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">設定</h2>
              <p className="text-gray-600">設定画面は開発中です</p>
            </div>
          </div>
        );
      default:
        return <PatientListPage />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthWrapper>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          <main>
            {renderCurrentPage()}
          </main>
        </div>
      </AuthWrapper>
    </ErrorBoundary>
  );
}

export default App;