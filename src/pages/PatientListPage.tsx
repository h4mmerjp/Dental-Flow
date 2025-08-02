import React, { useState } from 'react';
import { Plus, Search, Loader2, AlertCircle, FolderOpen, User, Play, Archive } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';
import { usePatientEditSessions } from '../hooks/usePatientEditSessions';
import { Patient } from '../types/patient';
import { EditSession } from '../types/patientWorkflow';
import { formatBirthdateWithAge } from '../utils/ageCalculator';
import { AddPatientModal } from '../components/patient/AddPatientModal';
import { PatientSessionSelectDialog } from '../components/patient/PatientSessionSelectDialog';
import { Notification, useNotification } from '../components/layout/Notification';

interface PatientListPageProps {
  onViewWorkflows?: (patientId: string) => void;
  onCreateWorkflow?: (patientId: string) => void;
  onViewPatientDetail?: (patientId: string) => void;
  onResumeEditSession?: (patientId: string, session: EditSession) => void;
}

export const PatientListPage: React.FC<PatientListPageProps> = ({ 
  onViewWorkflows, 
  onCreateWorkflow, 
  onViewPatientDetail, 
  onResumeEditSession 
}) => {
  const { patients, loading, error, addPatient } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedPatientForSession, setSelectedPatientForSession] = useState<Patient | null>(null);
  const [patientSessions, setPatientSessions] = useState<EditSession[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();

  // 編集セッション情報を取得
  const patientIds = patients.map(p => p.id);
  const { 
    sessionSummaries, 
    getPatientSessions, 
    getPatientSessionSummary 
  } = usePatientEditSessions(patientIds);

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastVisitDate = (date: string | null): string => {
    if (!date) return '未来院';
    return new Date(date).toLocaleDateString('ja-JP');
  };

  const handleViewWorkflows = (patientId: string) => {
    if (onViewWorkflows) {
      onViewWorkflows(patientId);
    } else {
      console.log('ワークフローを表示:', patientId);
    }
  };

  const handleCreateWorkflow = (patientId: string) => {
    if (onCreateWorkflow) {
      onCreateWorkflow(patientId);
    } else {
      console.log('ワークフロー作成:', patientId);
    }
  };

  const handleViewPatientDetail = (patientId: string) => {
    if (onViewPatientDetail) {
      onViewPatientDetail(patientId);
    } else {
      console.log('患者詳細表示:', patientId);
    }
  };

  const handleResumeSession = async (patient: Patient) => {
    setSelectedPatientForSession(patient);
    setSessionLoading(true);
    
    try {
      const sessions = await getPatientSessions(patient.id);
      setPatientSessions(sessions);
      setSessionDialogOpen(true);
    } catch (error) {
      showNotification('error', '編集セッション情報の取得に失敗しました');
      console.error('Error loading patient sessions:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSessionSelect = (session: EditSession) => {
    if (onResumeEditSession && selectedPatientForSession) {
      onResumeEditSession(selectedPatientForSession.id, session);
    }
    setSessionDialogOpen(false);
    setSelectedPatientForSession(null);
  };

  const formatSessionInfo = (patientId: string) => {
    const summary = getPatientSessionSummary(patientId);
    if (!summary || summary.totalSessions === 0) {
      return null;
    }

    const daysSinceUpdate = summary.lastUpdated ? 
      Math.floor((Date.now() - summary.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return {
      count: summary.totalSessions,
      lastUpdated: daysSinceUpdate,
      isRecent: summary.hasRecentSessions
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">患者データを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <span className="ml-2 text-red-600">
          エラーが発生しました: {error.message}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">患者一覧</h1>
          <p className="mt-2 text-sm text-gray-700">
            登録されている患者の一覧です。
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            新規患者を追加
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="患者名または患者IDで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? '検索条件に一致する患者がいません。' : '登録されている患者がいません。'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    患者ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    生年月日（年齢）
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終来院日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    編集セッション
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient: Patient) => {
                  const sessionInfo = formatSessionInfo(patient.id);
                  return (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.patientId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.nameKana}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatBirthdateWithAge(patient.birthdate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatLastVisitDate(patient.lastVisitDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sessionInfo ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Archive className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{sessionInfo.count}件</span>
                            </div>
                            {sessionInfo.isRecent && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                最近更新
                              </span>
                            )}
                            {sessionInfo.lastUpdated !== null && (
                              <span className="text-xs text-gray-500">
                                {sessionInfo.lastUpdated === 0 ? '今日' : 
                                 sessionInfo.lastUpdated === 1 ? '1日前' : 
                                 `${sessionInfo.lastUpdated}日前`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">なし</span>
                        )}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewPatientDetail(patient.id)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-3 h-3 mr-1" />
                          詳細
                        </button>
                        {sessionInfo && (
                          <button
                            onClick={() => handleResumeSession(patient)}
                            disabled={sessionLoading}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            セッション再開
                          </button>
                        )}
                        <button
                          onClick={() => handleCreateWorkflow(patient.id)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          ワークフロー作成
                        </button>
                        <button
                          onClick={() => handleViewWorkflows(patient.id)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                        >
                          <FolderOpen className="w-3 h-3 mr-1" />
                          ワークフロー一覧
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPatient={addPatient}
        onSuccess={(message) => showNotification('success', message)}
      />

      <PatientSessionSelectDialog
        isOpen={sessionDialogOpen}
        onClose={() => {
          setSessionDialogOpen(false);
          setSelectedPatientForSession(null);
        }}
        onResumeSession={handleSessionSelect}
        patient={selectedPatientForSession}
        sessions={patientSessions}
        loading={sessionLoading}
        error={null}
      />

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
};

export default PatientListPage;