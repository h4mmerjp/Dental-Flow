import React, { useState } from 'react';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { AuthWrapper } from './components/layout/AuthWrapper';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { PatientListPage } from './pages/PatientListPage';
import { DentalWorkflowPage } from './pages/DentalWorkflowPage';
import { WorkflowListPage } from './pages/WorkflowListPage';
import { WorkflowViewPage } from './pages/WorkflowViewPage';

function App() {
  const [currentPage, setCurrentPage] = useState('patients');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const handlePatientWorkflowView = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('workflow-list');
  };

  const handlePatientWorkflowCreate = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentPage('workflow-create');
  };

  const handleWorkflowView = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setCurrentPage('workflow-view');
  };

  const handleWorkflowEdit = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setCurrentPage('workflow-edit');
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
    setSelectedWorkflowId(null);
    setCurrentPage('patients');
  };

  const handleBackToWorkflows = () => {
    setSelectedWorkflowId(null);
    setCurrentPage('workflow-list');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'patients':
        return (
          <PatientListPage 
            onViewWorkflows={handlePatientWorkflowView}
            onCreateWorkflow={handlePatientWorkflowCreate}
          />
        );
      case 'workflow-list':
        return (
          <WorkflowListPage 
            patientId={selectedPatientId} 
            onBackToPatients={handleBackToPatients}
            onViewWorkflow={handleWorkflowView}
            onEditWorkflow={handleWorkflowEdit}
          />
        );
      case 'workflow-view':
        return (
          <WorkflowViewPage 
            workflowId={selectedWorkflowId} 
            onBackToWorkflows={handleBackToWorkflows}
            onEditWorkflow={handleWorkflowEdit}
          />
        );
      case 'workflow-create':
        return (
          <DentalWorkflowPage 
            patientId={selectedPatientId} 
            onBackToPatients={handleBackToPatients}
          />
        );
      case 'workflow-edit':
        return (
          <DentalWorkflowPage 
            patientId={selectedPatientId} 
            workflowId={selectedWorkflowId}
            onBackToPatients={handleBackToWorkflows}
          />
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
        return (
          <PatientListPage 
            onViewWorkflows={handlePatientWorkflowView}
            onCreateWorkflow={handlePatientWorkflowCreate}
          />
        );
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