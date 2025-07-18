import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Play, Pause, CheckCircle, Edit, Settings } from 'lucide-react';
import { usePatientWorkflows } from '../hooks/usePatientWorkflows';
import { usePatients } from '../hooks/usePatients';
import { PatientWorkflow } from '../types/patientWorkflow';
import { WorkflowNode } from '../types/dentalWorkflow';
import { Notification, useNotification } from '../components/layout/Notification';

interface WorkflowViewPageProps {
  workflowId: string | null;
  onBackToWorkflows?: () => void;
  onEditWorkflow?: (workflowId: string) => void;
}

export const WorkflowViewPage: React.FC<WorkflowViewPageProps> = ({
  workflowId,
  onBackToWorkflows,
  onEditWorkflow
}) => {
  const { getWorkflowById, updateWorkflowStatus } = usePatientWorkflows();
  const { patients } = usePatients();
  const { notification, showNotification, hideNotification } = useNotification();
  const [workflow, setWorkflow] = useState<PatientWorkflow | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (workflowId) {
      const foundWorkflow = getWorkflowById(workflowId);
      setWorkflow(foundWorkflow || null);
    }
  }, [workflowId, getWorkflowById]);

  const selectedPatient = workflow ? patients.find(p => p.id === workflow.patientId) : null;

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
      draft: { label: '下書き', className: 'bg-gray-100 text-gray-800', icon: Edit },
      active: { label: '実行中', className: 'bg-blue-100 text-blue-800', icon: Play },
      completed: { label: '完了', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { label: '一時停止', className: 'bg-yellow-100 text-yellow-800', icon: Pause }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <IconComponent className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const handleStatusChange = async (newStatus: PatientWorkflow['status']) => {
    if (!workflow) return;
    
    try {
      await updateWorkflowStatus(workflow.id, newStatus);
      setWorkflow(prev => prev ? { ...prev, status: newStatus } : null);
      showNotification('success', `ワークフローのステータスを変更しました`);
    } catch (error) {
      showNotification('error', 'ステータスの変更に失敗しました');
      console.error('Error updating workflow status:', error);
    }
  };

  const toggleNodeCompletion = (nodeId: string) => {
    setCompletedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderWorkflowNode = (node: WorkflowNode, index: number) => {
    const isCompleted = completedNodes.has(node.id);
    
    return (
      <div
        key={node.id}
        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
          isCompleted 
            ? 'bg-green-50 border-green-200' 
            : 'bg-white border-gray-200 hover:border-blue-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {index + 1}
              </div>
              <div>
                <h3 className={`font-medium ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                  {node.stepName}
                </h3>
                <p className="text-sm text-gray-600">
                  {node.treatment} | 歯: {node.teeth.join(', ')} | 病名: {node.condition}
                </p>
                
                {/* 治療選択ドロップダウン（編集可能な場合のみ） */}
                {node.hasMultipleTreatments && node.availableTreatments && node.availableTreatments.length > 1 && (
                  <div className="mt-2">
                    <select
                      value={node.selectedTreatmentIndex || 0}
                      onChange={(e) => {
                        // 将来的に治療選択変更機能を追加する場合はここに実装
                        console.log('Treatment selection changed:', e.target.value);
                      }}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                      disabled={true} // 閲覧モードなので無効化
                    >
                      {node.availableTreatments.map((treatment: any, treatmentIndex: number) => (
                        <option key={treatmentIndex} value={treatmentIndex}>
                          {treatment.name} ({treatment.duration}回)
                        </option>
                      ))}
                    </select>
                    <span className="ml-2 text-xs text-gray-500">
                      閲覧モード
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {node.isSequential && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  ステップ {node.cardNumber}/{node.totalCards}
                </span>
                {node.cardNumber > 1 && (
                  <span className="text-xs text-gray-500">
                    継続治療
                  </span>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={() => toggleNodeCompletion(node.id)}
            className={`ml-4 p-2 rounded-full transition-colors ${
              isCompleted
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderToothConditions = () => {
    if (!workflow?.toothConditions || Object.keys(workflow.toothConditions).length === 0) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">歯式情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(workflow.toothConditions).map(([tooth, conditions]) => {
            const isBulkEntry = tooth.startsWith('bulk-');
            const displayTooth = isBulkEntry ? '全般' : `歯番 ${tooth}`;
            
            return (
              <div key={tooth} className={`p-3 rounded border ${isBulkEntry ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
                <div className="font-medium text-sm mb-1">
                  {displayTooth}
                  {isBulkEntry && (
                    <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                      歯番号なし
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {conditions.map((condition, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!workflowId || !workflow) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ワークフローが見つかりません</h2>
          <p className="text-gray-600 mb-6">
            指定されたワークフローが存在しないか、読み込みに失敗しました。
          </p>
          {onBackToWorkflows && (
            <button
              onClick={onBackToWorkflows}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ワークフロー一覧に戻る
            </button>
          )}
        </div>
      </div>
    );
  }

  const completedCount = completedNodes.size;
  const totalCount = workflow.workflowNodes?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {onBackToWorkflows && (
              <button
                onClick={onBackToWorkflows}
                className="inline-flex items-center mb-3 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                ワークフロー一覧に戻る
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {workflow.workflowTitle}
            </h1>
            {workflow.description && (
              <p className="text-gray-600 mb-4">{workflow.description}</p>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>患者: {selectedPatient?.name || '不明'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>作成: {formatDate(workflow.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>更新: {formatDate(workflow.updatedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusBadge(workflow.status)}
            
            {/* ステータス変更ボタン */}
            <div className="flex gap-2">
              {workflow.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Play className="w-4 h-4 mr-1" />
                  開始
                </button>
              )}
              {workflow.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStatusChange('paused')}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    一時停止
                  </button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium rounded text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    完了
                  </button>
                </>
              )}
              {workflow.status === 'paused' && (
                <button
                  onClick={() => handleStatusChange('active')}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Play className="w-4 h-4 mr-1" />
                  再開
                </button>
              )}
              
              {/* 編集ボタン */}
              {onEditWorkflow && (
                <button
                  onClick={() => onEditWorkflow(workflow.id)}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium rounded text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  編集
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 進捗バー */}
        {totalCount > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">治療進捗</span>
              <span className="text-sm text-gray-600">
                {completedCount}/{totalCount} 完了 ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 歯式情報 */}
      {renderToothConditions()}

      {/* ワークフローノード */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">治療ステップ</h2>
        
        {!workflow.workflowNodes || workflow.workflowNodes.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">治療ステップがありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflow.workflowNodes.map((node, index) => 
              renderWorkflowNode(node, index)
            )}
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