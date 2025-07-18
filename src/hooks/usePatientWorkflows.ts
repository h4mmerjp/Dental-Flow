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
  PatientWorkflowFormData 
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
  };
};