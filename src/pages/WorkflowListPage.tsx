import React, { useState } from 'react';
import { ArrowLeft, Calendar, User, Play, Trash2, Edit, AlertCircle, Loader2 } from 'lucide-react';
import { usePatientWorkflows } from '../hooks/usePatientWorkflows';
import { usePatients } from '../hooks/usePatients';
import { PatientWorkflow } from '../types/patientWorkflow';
import { Notification, useNotification } from '../components/layout/Notification';

interface WorkflowListPageProps {
  patientId: string | null;
  onBackToPatients?: () => void;
  onEditWorkflow?: (workflowId: string) => void;
  onViewWorkflow?: (workflowId: string) => void;
}

export const WorkflowListPage: React.FC<WorkflowListPageProps> = ({
  patientId,
  onBackToPatients,
  onEditWorkflow,
  onViewWorkflow
}) => {
  const { workflows, loading, error, deleteWorkflow, updateWorkflowStatus } = usePatientWorkflows(patientId || undefined);
  const { patients } = usePatients();
  const { notification, showNotification, hideNotification } = useNotification();
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);

  const selectedPatient = patientId ? patients.find(p => p.id === patientId) : null;

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '不明';
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: PatientWorkflow['status']) => {
    const statusConfig = {
      draft: { label: '下書き', className: 'bg-gray-100 text-gray-800' },
      active: { label: '実行中', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '完了', className: 'bg-green-100 text-green-800' },
      paused: { label: '一時停止', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleDeleteWorkflow = async (workflowId: string, workflowTitle: string) => {
    if (!window.confirm(`ワークフロー「${workflowTitle}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setDeletingWorkflowId(workflowId);
    try {
      await deleteWorkflow(workflowId);
      showNotification('success', 'ワークフローを削除しました');
    } catch (error) {
      showNotification('error', 'ワークフローの削除に失敗しました');
      console.error('Error deleting workflow:', error);
    } finally {
      setDeletingWorkflowId(null);
    }
  };

  const handleStatusChange = async (workflowId: string, newStatus: PatientWorkflow['status']) => {
    try {
      await updateWorkflowStatus(workflowId, newStatus);
      showNotification('success', `ワークフローのステータスを「${getStatusBadge(newStatus).props.children}」に変更しました`);
    } catch (error) {
      showNotification('error', 'ステータスの変更に失敗しました');
      console.error('Error updating workflow status:', error);
    }
  };

  if (!patientId || !selectedPatient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">患者を選択してください</h2>
          <p className="text-gray-600 mb-6">
            ワークフロー一覧を表示するには、まず患者を選択してください。
          </p>
          {onBackToPatients && (
            <button
              onClick={onBackToPatients}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              患者一覧に戻る
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">ワークフローを読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <span className="ml-2 text-red-600">
            エラーが発生しました: {error.message}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            {onBackToPatients && (
              <button
                onClick={onBackToPatients}
                className="inline-flex items-center mb-3 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                患者一覧に戻る
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedPatient.name}さんのワークフロー一覧
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>患者ID: {selectedPatient.patientId}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>ワークフロー数: {workflows.length}件</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ワークフロー一覧 */}
      <div className="bg-white rounded-lg shadow-md">
        {workflows.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">ワークフローがありません</h2>
            <p className="text-gray-600 mb-6">
              この患者のワークフローはまだ作成されていません。
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ワークフロー名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ノード数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新日時
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={() => onViewWorkflow && onViewWorkflow(workflow.id)}
                      >
                        {workflow.workflowTitle}
                      </div>
                      {workflow.description && (
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {workflow.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(workflow.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workflow.workflowNodes?.length || 0}件
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(workflow.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(workflow.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* ステータス変更ボタン */}
                        {workflow.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(workflow.id, 'active')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            開始
                          </button>
                        )}
                        {workflow.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(workflow.id, 'completed')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            完了
                          </button>
                        )}
                        
                        {/* 編集ボタン */}
                        {onEditWorkflow && (
                          <button
                            onClick={() => onEditWorkflow(workflow.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            編集
                          </button>
                        )}
                        
                        {/* 削除ボタン */}
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id, workflow.workflowTitle)}
                          disabled={deletingWorkflowId === workflow.id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deletingWorkflowId === workflow.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 mr-1" />
                          )}
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 通知 */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
};