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
  TreatmentStep, 
  TreatmentStepFormData,
  calculateTotalCost,
  calculateTotalDuration 
} from '../types/treatmentPlan';

export const useTreatmentSteps = (treatmentPlanId?: string) => {
  const [treatmentSteps, setTreatmentSteps] = useState<TreatmentStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser || !treatmentPlanId) {
      setLoading(false);
      return;
    }

    const treatmentStepsCollection = collection(db, 'treatmentSteps');
    const treatmentStepsQuery = query(
      treatmentStepsCollection,
      where('treatmentPlanId', '==', treatmentPlanId),
      orderBy('stepNumber', 'asc')
    );

    const unsubscribe = onSnapshot(
      treatmentStepsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const stepsData: TreatmentStep[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as TreatmentStep[];
          
          setTreatmentSteps(stepsData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to process treatment steps'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err instanceof Error ? err : new Error('Failed to fetch treatment steps'));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, treatmentPlanId]);

  const createTreatmentStep = async (
    treatmentPlanId: string,
    stepData: TreatmentStepFormData
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // 次のステップ番号を計算
      const nextStepNumber = treatmentSteps.length + 1;

      const treatmentStepsCollection = collection(db, 'treatmentSteps');
      const docRef = await addDoc(treatmentStepsCollection, {
        ...stepData,
        treatmentPlanId,
        stepNumber: nextStepNumber,
        status: 'planned',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 治療計画の総コストと時間を更新
      await updateTreatmentPlanTotals(treatmentPlanId);
      
      return docRef.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create treatment step');
      throw error;
    }
  };

  const updateTreatmentStep = async (
    stepId: string,
    updates: Partial<TreatmentStepFormData>
  ): Promise<void> => {
    try {
      const stepRef = doc(db, 'treatmentSteps', stepId);
      await updateDoc(stepRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // 治療計画の総コストと時間を更新
      if (treatmentPlanId) {
        await updateTreatmentPlanTotals(treatmentPlanId);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update treatment step');
      throw error;
    }
  };

  const deleteTreatmentStep = async (stepId: string): Promise<void> => {
    try {
      const stepRef = doc(db, 'treatmentSteps', stepId);
      await deleteDoc(stepRef);

      // 治療計画の総コストと時間を更新
      if (treatmentPlanId) {
        await updateTreatmentPlanTotals(treatmentPlanId);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete treatment step');
      throw error;
    }
  };

  const updateTreatmentStepStatus = async (
    stepId: string,
    status: TreatmentStep['status']
  ): Promise<void> => {
    try {
      const stepRef = doc(db, 'treatmentSteps', stepId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'completed') {
        updateData.completedDate = new Date().toISOString().split('T')[0];
      }

      await updateDoc(stepRef, updateData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update treatment step status');
      throw error;
    }
  };

  const reorderTreatmentSteps = async (reorderedSteps: TreatmentStep[]): Promise<void> => {
    try {
      const updatePromises = reorderedSteps.map((step, index) => {
        const stepRef = doc(db, 'treatmentSteps', step.id);
        return updateDoc(stepRef, {
          stepNumber: index + 1,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(updatePromises);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reorder treatment steps');
      throw error;
    }
  };

  const updateTreatmentPlanTotals = async (planId: string): Promise<void> => {
    try {
      const totalCost = calculateTotalCost(treatmentSteps);
      const totalDuration = calculateTotalDuration(treatmentSteps);

      const planRef = doc(db, 'treatmentPlans', planId);
      await updateDoc(planRef, {
        totalEstimatedCost: totalCost,
        totalEstimatedDuration: totalDuration,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to update treatment plan totals:', err);
    }
  };

  const getStepById = useCallback((stepId: string): TreatmentStep | undefined => {
    return treatmentSteps.find(step => step.id === stepId);
  }, [treatmentSteps]);

  const getStepsByStatus = useCallback((status: TreatmentStep['status']): TreatmentStep[] => {
    return treatmentSteps.filter(step => step.status === status);
  }, [treatmentSteps]);

  const getStepsByCategory = useCallback((category: TreatmentStep['category']): TreatmentStep[] => {
    return treatmentSteps.filter(step => step.category === category);
  }, [treatmentSteps]);

  return {
    treatmentSteps,
    loading,
    error,
    createTreatmentStep,
    updateTreatmentStep,
    deleteTreatmentStep,
    updateTreatmentStepStatus,
    reorderTreatmentSteps,
    getStepById,
    getStepsByStatus,
    getStepsByCategory,
  };
};