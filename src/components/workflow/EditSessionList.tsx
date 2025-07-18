import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Trash2, Play } from 'lucide-react';
import { EditSession } from '../../types/patientWorkflow';
import { usePatients } from '../../hooks/usePatients';

interface EditSessionListProps {
  patientId?: string;
  onSelectSession: (session: EditSession) => void;
  onClose: () => void;
}

export const EditSessionList: React.FC<EditSessionListProps> = ({
  patientId,
  onSelectSession,
  onClose
}) => {
  const [sessions, setSessions] = useState<EditSession[]>([]);
  const { patients } = usePatients();

  useEffect(() => {
    const loadSessions = () => {
      try {
        const storedSessions = JSON.parse(localStorage.getItem('editSessions') || '[]');
        let filteredSessions = storedSessions;

        if (patientId) {
          filteredSessions = storedSessions.filter((session: EditSession) => 
            session.patientId === patientId
          );
        }

        setSessions(filteredSessions);
      } catch (error) {
        console.error('Error loading edit sessions:', error);
        setSessions([]);
      }
    };

    loadSessions();
  }, [patientId]);

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('このセッションを削除しますか？')) {
      try {
        const storedSessions = JSON.parse(localStorage.getItem('editSessions') || '[]');
        const updatedSessions = storedSessions.filter((session: EditSession) => 
          session.id !== sessionId
        );
        localStorage.setItem('editSessions', JSON.stringify(updatedSessions));
        setSessions(sessions.filter(session => session.id !== sessionId));
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : '不明な患者';
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '不明な日付';
    }
  };

  const getSessionSummary = (session: EditSession) => {
    const toothCount = Object.keys(session.toothConditions).length;
    const nodeCount = session.workflowNodes.length;
    return `歯数: ${toothCount}, 治療ノード: ${nodeCount}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">保存済み編集セッション</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>保存済みの編集セッションがありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{session.sessionName}</h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getPatientName(session.patientId)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(session.updatedAt)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      {getSessionSummary(session)}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onSelectSession(session)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      復元
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};