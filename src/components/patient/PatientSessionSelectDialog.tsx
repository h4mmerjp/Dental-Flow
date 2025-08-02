import React, { useState, useEffect } from 'react';
import { X, Play, Search, Calendar, Clock, AlertCircle, Archive } from 'lucide-react';
import { EditSession } from '../../types/patientWorkflow';
import { Patient } from '../../types/patient';

interface PatientSessionSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeSession: (session: EditSession) => void;
  patient: Patient | null;
  sessions: EditSession[];
  loading: boolean;
  error: string | null;
}

export const PatientSessionSelectDialog: React.FC<PatientSessionSelectDialogProps> = ({
  isOpen,
  onClose,
  onResumeSession,
  patient,
  sessions,
  loading,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<EditSession | null>(null);

  // ダイアログが開かれたときの初期設定
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedSession(null);
    }
  }, [isOpen]);

  // 検索フィルタリング
  const filteredSessions = sessions.filter(session => 
    session.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResumeSession = () => {
    if (selectedSession) {
      onResumeSession(selectedSession);
      onClose();
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

  const getSessionProgress = (session: EditSession) => {
    const { conditionCount, nodeCount, slotCount } = getSessionPreview(session);
    const totalItems = conditionCount + nodeCount + slotCount;
    
    if (totalItems === 0) return { progress: 0, label: '未開始' };
    if (nodeCount === 0) return { progress: 25, label: '歯式入力済み' };
    if (slotCount === 0) return { progress: 50, label: 'ノード生成済み' };
    return { progress: 75, label: 'スケジュール作成済み' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">編集セッションから再開</h2>
            {patient && (
              <p className="text-sm text-gray-600 mt-1">
                患者: {patient.name} ({patient.patientId})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 検索バー */}
        <div className="p-6 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="セッション名で検索..."
              disabled={loading}
            />
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* セッション一覧 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">読み込み中...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">編集セッションが見つかりません</p>
                <p className="text-sm">
                  {searchTerm ? '検索条件に該当するセッションがありません' : 'この患者の保存されたセッションがありません'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-4">
                {filteredSessions.map((session) => {
                  const preview = getSessionPreview(session);
                  const progress = getSessionProgress(session);
                  const isSelected = selectedSession?.id === session.id;
                  
                  return (
                    <div
                      key={session.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{session.sessionName}</h3>
                            {session.isTemporary && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                一時保存
                              </span>
                            )}
                          </div>
                          
                          {/* 進捗バー */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">進捗状況</span>
                              <span className="text-xs text-gray-600">{progress.label}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex gap-4 text-sm text-gray-600 mb-3">
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
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>作成: {formatDate(session.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>更新: {formatDate(session.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          {isSelected && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Play className="w-4 h-4" />
                              <span className="text-sm font-medium">選択中</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 選択されたセッションの詳細 */}
        {selectedSession && (
          <div className="border-t bg-gray-50 p-6">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">選択したセッション</h4>
              <p className="text-sm text-gray-600">
                "{selectedSession.sessionName}" から編集を再開します。
              </p>
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            onClick={handleResumeSession}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            disabled={loading || !selectedSession}
          >
            <Play className="w-4 h-4" />
            編集を再開
          </button>
        </div>
      </div>
    </div>
  );
};