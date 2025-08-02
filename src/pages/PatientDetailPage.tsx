import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Play, Archive, Calendar, Clock, User, Edit3, Trash2, Download } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';
import { usePatientWorkflows } from '../hooks/usePatientWorkflows';
import { useEditSessionRestore } from '../hooks/useEditSessionRestore';
import { EditSession } from '../types/patientWorkflow';
import { formatBirthdateWithAge } from '../utils/ageCalculator';
import { Notification, useNotification } from '../components/layout/Notification';

interface PatientDetailPageProps {
  patientId: string;
  onBack: () => void;
  onCreateWorkflow?: (patientId: string) => void;
  onEditWorkflow?: (workflowId: string) => void;
  onRestoreSession?: (patientId: string, sessionId: string) => void;
}

export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({
  patientId,
  onBack,
  onCreateWorkflow,
  onEditWorkflow,
  onRestoreSession
}) => {
  const { patients, loading: patientsLoading } = usePatients();
  const { 
    workflows: patientWorkflows, 
    loading: workflowsLoading, 
    deleteWorkflow, 
    createWorkflowFromEditSession 
  } = usePatientWorkflows(patientId);
  const { 
    editSessions, 
    loading: sessionsLoading, 
    loadEditSessions, 
    deleteEditSession
  } = useEditSessionRestore();
  const { notification, showNotification, hideNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<'workflows' | 'sessions'>('workflows');

  const patient = patients.find(p => p.id === patientId);
  const workflows = patientWorkflows;

  // 編集セッションを読み込み
  useEffect(() => {
    const loadSessions = async () => {
      try {
        await loadEditSessions(patientId);
      } catch (error) {
        console.error('Error loading edit sessions:', error);
      }
    };
    loadSessions();
  }, [patientId, loadEditSessions]);

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (window.confirm('このワークフローを削除してもよろしいですか？')) {
      try {
        await deleteWorkflow(workflowId);
        showNotification('success', 'ワークフローを削除しました');
      } catch (error) {
        showNotification('error', 'ワークフローの削除に失敗しました');
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('この編集セッションを削除してもよろしいですか？')) {
      try {
        await deleteEditSession(sessionId);
        showNotification('success', '編集セッションを削除しました');
      } catch (error) {
        showNotification('error', '編集セッションの削除に失敗しました');
      }
    }
  };

  const handleCreateWorkflowFromSession = async (session: EditSession) => {
    try {
      const newWorkflowId = await createWorkflowFromEditSession(session);
      if (newWorkflowId) {
        showNotification('success', `編集セッション「${session.sessionName}」からワークフローを作成しました`);
        if (onEditWorkflow) {
          onEditWorkflow(newWorkflowId);
        }
      }
    } catch (error) {
      showNotification('error', 'ワークフローの作成に失敗しました');
    }
  };

  const handleRestoreSession = (session: EditSession) => {
    if (onRestoreSession) {
      onRestoreSession(patientId, session.id);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionPreview = (session: EditSession) => {
    const conditionCount = Object.keys(session.toothConditions).length;
    const nodeCount = session.workflowNodes.length;
    const slotCount = session.scheduleSlots.length;
    return { conditionCount, nodeCount, slotCount };
  };

  if (patientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-gray-600">患者情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg">患者が見つかりません</div>
          <button
            onClick={onBack}
            className="mt-4 inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          患者一覧に戻る
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>患者ID: {patient.patientId}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatBirthdateWithAge(patient.birthdate)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  フリガナ: {patient.nameKana}
                </div>
                {patient.lastVisitDate && (
                  <div className="text-sm text-gray-500">
                    最終来院日: {formatDate(patient.lastVisitDate)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onCreateWorkflow && onCreateWorkflow(patientId)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                新規ワークフロー作成
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workflows'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ワークフロー一覧
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              編集セッション一覧
            </button>
          </nav>
        </div>
      </div>

      {/* コンテンツエリア */}
      {activeTab === 'workflows' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">ワークフロー一覧</h2>
          </div>
          
          {workflowsLoading ? (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-gray-600">読み込み中...</span>
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              まだワークフローが作成されていません
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {workflow.workflowTitle || 'ワークフロー'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {workflow.description || '説明なし'}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>作成日: {formatDate(workflow.createdAt)}</span>
                        <span>更新日: {formatDate(workflow.updatedAt)}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                          workflow.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {workflow.status === 'completed' ? '完了' :
                           workflow.status === 'active' ? '進行中' : '下書き'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => onEditWorkflow && onEditWorkflow(workflow.id)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">編集セッション一覧</h2>
          </div>
          
          {sessionsLoading ? (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-gray-600">読み込み中...</span>
            </div>
          ) : editSessions.filter(s => s.patientId === patientId).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              まだ編集セッションが保存されていません
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {editSessions
                .filter(session => session.patientId === patientId)
                .map((session) => {
                  const preview = getSessionPreview(session);
                  return (
                    <div key={session.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {session.sessionName}
                            </h3>
                            {session.isTemporary && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                一時保存
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>歯の状態: {preview.conditionCount}件</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>治療ノード: {preview.nodeCount}件</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span>スケジュール: {preview.slotCount}件</span>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>作成: {formatDate(session.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>更新: {formatDate(session.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleRestoreSession(session)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            復元
                          </button>
                          <button
                            onClick={() => handleCreateWorkflowFromSession(session)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            ワークフロー化
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
};