import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc,
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { 
  PatientWorkflow, 
  PatientWorkflowFormData,
  WorkflowTemplate,
  EditSession 
} from '../types/patientWorkflow';

export const usePatientWorkflows = (patientId?: string) => {
  const [workflows, setWorkflows] = useState<PatientWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const workflowsCollection = collection(db, 'patientWorkflows');
    let workflowsQuery = query(
      workflowsCollection,
      orderBy('updatedAt', 'desc')
    );

    // 特定の患者のワークフローのみを取得する場合
    if (patientId) {
      workflowsQuery = query(
        workflowsCollection,
        where('patientId', '==', patientId),
        orderBy('updatedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      workflowsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const workflowsData: PatientWorkflow[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as PatientWorkflow[];
          
          setWorkflows(workflowsData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to process workflows'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err instanceof Error ? err : new Error('Failed to fetch workflows'));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, patientId]);

  const createWorkflow = async (
    patientId: string,
    workflowData: PatientWorkflowFormData
  ): Promise<string> => {
    console.log('createWorkflow called with:', {
      patientId,
      currentUser: currentUser ? currentUser.uid : 'null',
      workflowData
    });

    if (!currentUser) {
      console.error('User not authenticated - currentUser is null');
      throw new Error('User not authenticated');
    }

    try {
      const workflowsCollection = collection(db, 'patientWorkflows');
      const docRef = await addDoc(workflowsCollection, {
        ...workflowData,
        patientId,
        workflowNodes: [],
        status: 'draft',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create workflow');
      throw error;
    }
  };

  const updateWorkflow = async (
    workflowId: string,
    updates: Partial<PatientWorkflowFormData>
  ): Promise<void> => {
    try {
      const workflowRef = doc(db, 'patientWorkflows', workflowId);
      await updateDoc(workflowRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update workflow');
      throw error;
    }
  };

  const updateWorkflowNodes = async (
    workflowId: string,
    workflowNodes: PatientWorkflow['workflowNodes']
  ): Promise<void> => {
    try {
      const workflowRef = doc(db, 'patientWorkflows', workflowId);
      await updateDoc(workflowRef, {
        workflowNodes,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update workflow nodes');
      throw error;
    }
  };

  const saveEditState = async (
    workflowId: string,
    editState: PatientWorkflow['editState']
  ): Promise<void> => {
    try {
      const workflowRef = doc(db, 'patientWorkflows', workflowId);
      await updateDoc(workflowRef, {
        editState: {
          ...editState,
          lastEditedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save edit state');
      throw error;
    }
  };

  const saveDraft = async (
    workflowId: string,
    draftData: {
      toothConditions: PatientWorkflow['toothConditions'];
      workflowNodes: PatientWorkflow['workflowNodes'];
      editState: PatientWorkflow['editState'];
      settings: PatientWorkflow['settings'];
    }
  ): Promise<void> => {
    try {
      const workflowRef = doc(db, 'patientWorkflows', workflowId);
      await updateDoc(workflowRef, {
        ...draftData,
        status: 'draft',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save draft');
      throw error;
    }
  };

  const updateWorkflowStatus = async (
    workflowId: string,
    status: PatientWorkflow['status']
  ): Promise<void> => {
    try {
      const workflowRef = doc(db, 'patientWorkflows', workflowId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(workflowRef, updateData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update workflow status');
      throw error;
    }
  };

  const deleteWorkflow = async (workflowId: string): Promise<void> => {
    try {
      const workflowRef = doc(db, 'patientWorkflows', workflowId);
      await deleteDoc(workflowRef);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete workflow');
      throw error;
    }
  };

  const getWorkflowById = useCallback((workflowId: string): PatientWorkflow | undefined => {
    return workflows.find(workflow => workflow.id === workflowId);
  }, [workflows]);

  const getWorkflowsByPatient = useCallback((patientId: string): PatientWorkflow[] => {
    return workflows.filter(workflow => workflow.patientId === patientId);
  }, [workflows]);

  const getActiveWorkflows = useCallback((): PatientWorkflow[] => {
    return workflows.filter(workflow => workflow.status === 'active');
  }, [workflows]);

  const createWorkflowFromTemplate = async (
    patientId: string,
    template: WorkflowTemplate,
    workflowTitle?: string
  ): Promise<string> => {
    try {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const workflowData: PatientWorkflowFormData = {
        workflowTitle: workflowTitle || `${template.templateName} - 患者ワークフロー`,
        description: template.description || `${template.templateName}テンプレートから作成`,
        toothConditions: template.toothConditions,
        settings: template.settings
      };

      const docRef = await addDoc(collection(db, 'patientWorkflows'), {
        patientId,
        workflowTitle: workflowData.workflowTitle,
        description: workflowData.description,
        toothConditions: workflowData.toothConditions,
        workflowNodes: template.workflowNodes,
        settings: workflowData.settings || {},
        status: 'draft',
        editState: {
          scheduleSlots: template.scheduleSlots,
          selectedTreatmentOptions: template.selectedTreatmentOptions,
          lastEditedAt: serverTimestamp()
        },
        
        // ソース情報
        sourceType: 'template',
        sourceId: template.id,
        
        // メタデータ
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });

      return docRef.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create workflow from template');
      setError(error);
      throw error;
    }
  };

  const createWorkflowFromEditSession = async (
    editSession: EditSession,
    workflowTitle?: string
  ): Promise<string> => {
    try {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const workflowData: PatientWorkflowFormData = {
        workflowTitle: workflowTitle || `${editSession.sessionName} - ワークフロー`,
        description: `編集セッション「${editSession.sessionName}」から作成されたワークフロー`,
        toothConditions: editSession.toothConditions,
        settings: editSession.settings
      };

      const docRef = await addDoc(collection(db, 'patientWorkflows'), {
        patientId: editSession.patientId,
        workflowTitle: workflowData.workflowTitle,
        description: workflowData.description,
        toothConditions: workflowData.toothConditions,
        workflowNodes: editSession.workflowNodes,
        settings: workflowData.settings || {},
        status: 'draft',
        priority: 'medium',
        editState: {
          scheduleSlots: editSession.scheduleSlots,
          selectedTreatmentOptions: editSession.selectedTreatmentOptions,
          lastEditedAt: serverTimestamp()
        },
        
        // ソース情報
        sourceType: 'edit_session',
        sourceId: editSession.id,
        
        // メタデータ
        metadata: {
          originalSessionName: editSession.sessionName,
          createdFromSession: true,
          sessionCreatedAt: editSession.createdAt,
          sessionUpdatedAt: editSession.updatedAt
        },
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });

      return docRef.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create workflow from edit session');
      setError(error);
      throw error;
    }
  };

  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    updateWorkflowNodes,
    updateWorkflowStatus,
    deleteWorkflow,
    getWorkflowById,
    getWorkflowsByPatient,
    getActiveWorkflows,
    saveEditState,
    saveDraft,
    createWorkflowFromTemplate,
    createWorkflowFromEditSession,
  };
};