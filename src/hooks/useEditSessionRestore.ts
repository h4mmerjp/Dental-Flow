import { useState, useCallback } from 'react';
import { EditSession, PatientWorkflow } from '../types/patientWorkflow';
import { usePatientWorkflows } from './usePatientWorkflows';
import { EditSessionService } from '../services/editSessionService';
import { useAuth } from './useAuth';

interface EditSessionRestoreState {
  loading: boolean;
  error: string | null;
  editSessions: EditSession[];
  showRestoreDialog: boolean;
}

export const useEditSessionRestore = () => {
  const [state, setState] = useState<EditSessionRestoreState>({
    loading: false,
    error: null,
    editSessions: [],
    showRestoreDialog: false
  });

  const { updateWorkflow, createWorkflowFromEditSession } = usePatientWorkflows();
  const { currentUser } = useAuth();

  // Firestoreから編集セッション一覧を取得
  const loadEditSessions = useCallback(async (patientId?: string): Promise<EditSession[]> => {
    try {
      if (!currentUser) {
        // ログインしていない場合はローカルストレージから取得
        const savedSessions = localStorage.getItem('editSessions');
        if (savedSessions) {
          return JSON.parse(savedSessions) as EditSession[];
        }
        return [];
      }

      // Firestoreから取得
      const sessions = await EditSessionService.getEditSessions(patientId);
      return sessions;
    } catch (error) {
      console.error('Error loading edit sessions:', error);
      
      // フォールバック: ローカルストレージから取得
      try {
        const savedSessions = localStorage.getItem('editSessions');
        if (savedSessions) {
          return JSON.parse(savedSessions) as EditSession[];
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
      
      return [];
    }
  }, [currentUser]);

  // 復元ダイアログを開く
  const openRestoreDialog = useCallback(async (patientId?: string) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      showRestoreDialog: true
    }));

    try {
      const sessions = await loadEditSessions(patientId);
      
      // 最新の更新日時順でソート
      const sortedSessions = sessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setState(prev => ({
        ...prev,
        loading: false,
        editSessions: sortedSessions
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '編集セッションの読み込みに失敗しました'
      }));
    }
  }, [loadEditSessions]);

  // 復元ダイアログを閉じる
  const closeRestoreDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      showRestoreDialog: false,
      error: null
    }));
  }, []);

  // 編集セッションの状態を復元
  const restoreEditSession = useCallback((editSession: EditSession): PatientWorkflow => {
    try {
      // EditSessionからPatientWorkflowを復元
      const restoredWorkflow: PatientWorkflow = {
        id: editSession.id,
        patientId: editSession.patientId,
        workflowTitle: editSession.sessionName,
        description: `編集セッション「${editSession.sessionName}」から復元`,
        toothConditions: editSession.toothConditions,
        workflowNodes: editSession.workflowNodes,
        settings: editSession.settings,
        status: 'active',
        sourceType: 'edit_session',
        sourceId: editSession.id,
        createdAt: editSession.createdAt,
        updatedAt: new Date(),
        createdBy: currentUser?.uid || 'anonymous'
      };

      return restoredWorkflow;
    } catch (error) {
      throw new Error(`編集セッションの復元に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, []);

  // 編集セッションを適用（現在の患者ワークフローに適用）
  const applyEditSession = useCallback(async (editSession: EditSession, currentWorkflowId: string): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // 編集セッションから復元したワークフローを作成
      const restoredWorkflow = restoreEditSession(editSession);
      
      // 現在のワークフローIDを保持
      restoredWorkflow.id = currentWorkflowId;
      
      // 患者ワークフローを更新
      await updateWorkflow(currentWorkflowId, restoredWorkflow);

      setState(prev => ({
        ...prev,
        loading: false,
        showRestoreDialog: false
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '編集セッションの適用に失敗しました'
      }));
      return false;
    }
  }, [restoreEditSession, updateWorkflow]);

  // 新しいワークフローとして編集セッションを復元
  const restoreAsNewWorkflow = useCallback(async (editSession: EditSession): Promise<string | null> => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // Firestoreでワークフローを作成
      if (currentUser) {
        const newWorkflowId = await createWorkflowFromEditSession(editSession);
        
        setState(prev => ({
          ...prev,
          loading: false,
          showRestoreDialog: false
        }));

        return newWorkflowId;
      } else {
        // ログインしていない場合はローカルストレージに保存
        const newWorkflow = restoreEditSession(editSession);
        
        // 新しいIDを生成
        const newId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newWorkflow.id = newId;
        
        const existingWorkflows = JSON.parse(localStorage.getItem('patientWorkflows') || '[]');
        existingWorkflows.push(newWorkflow);
        localStorage.setItem('patientWorkflows', JSON.stringify(existingWorkflows));

        setState(prev => ({
          ...prev,
          loading: false,
          showRestoreDialog: false
        }));

        return newId;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '新しいワークフローとしての復元に失敗しました'
      }));
      return null;
    }
  }, [restoreEditSession, currentUser]);

  // 編集セッションを削除
  const deleteEditSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      if (currentUser) {
        // Firestoreから削除
        await EditSessionService.deleteEditSession(sessionId);
      } else {
        // ローカルストレージから削除
        const savedSessions = localStorage.getItem('editSessions');
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions) as EditSession[];
          const filteredSessions = sessions.filter(session => session.id !== sessionId);
          localStorage.setItem('editSessions', JSON.stringify(filteredSessions));
        }
      }
      
      // 状態を更新
      setState(prev => ({
        ...prev,
        editSessions: prev.editSessions.filter(session => session.id !== sessionId)
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '編集セッションの削除に失敗しました'
      }));
      return false;
    }
  }, [currentUser]);

  // 編集セッションの詳細を取得
  const getEditSessionDetails = useCallback(async (sessionId: string): Promise<EditSession | null> => {
    const sessions = await loadEditSessions();
    return sessions.find(session => session.id === sessionId) || null;
  }, [loadEditSessions]);

  // 編集セッションのプレビュー情報を取得
  const getSessionPreview = useCallback((editSession: EditSession) => {
    const conditionCount = Object.keys(editSession.toothConditions).length;
    const nodeCount = editSession.workflowNodes.length;
    const slotCount = editSession.scheduleSlots.length;
    
    return {
      conditionCount,
      nodeCount,
      slotCount,
      totalItems: conditionCount + nodeCount + slotCount,
      lastModified: new Date(editSession.updatedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }, []);

  return {
    // 状態
    loading: state.loading,
    error: state.error,
    editSessions: state.editSessions,
    showRestoreDialog: state.showRestoreDialog,

    // アクション
    openRestoreDialog,
    closeRestoreDialog,
    restoreEditSession,
    applyEditSession,
    restoreAsNewWorkflow,
    deleteEditSession,
    getEditSessionDetails,
    getSessionPreview,
    
    // ユーティリティ
    loadEditSessions
  };
};