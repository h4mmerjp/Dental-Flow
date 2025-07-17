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
  TreatmentPlan, 
  TreatmentPlanFormData,
  calculateTotalCost,
  calculateTotalDuration 
} from '../types/treatmentPlan';

export const useTreatmentPlans = (patientId?: string) => {
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const treatmentPlansCollection = collection(db, 'treatmentPlans');
    let treatmentPlansQuery = query(
      treatmentPlansCollection,
      orderBy('createdAt', 'desc')
    );

    // 特定の患者の治療計画のみを取得する場合
    if (patientId) {
      treatmentPlansQuery = query(
        treatmentPlansCollection,
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      treatmentPlansQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const treatmentPlansData: TreatmentPlan[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as TreatmentPlan[];
          
          setTreatmentPlans(treatmentPlansData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to process treatment plans'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err instanceof Error ? err : new Error('Failed to fetch treatment plans'));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, patientId]);

  const createTreatmentPlan = async (
    patientId: string,
    planData: TreatmentPlanFormData
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const treatmentPlansCollection = collection(db, 'treatmentPlans');
      const docRef = await addDoc(treatmentPlansCollection, {
        ...planData,
        patientId,
        status: 'planned',
        totalEstimatedCost: 0,
        totalEstimatedDuration: 0,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create treatment plan');
      throw error;
    }
  };

  const updateTreatmentPlan = async (
    planId: string,
    updates: Partial<TreatmentPlanFormData>
  ): Promise<void> => {
    try {
      const planRef = doc(db, 'treatmentPlans', planId);
      await updateDoc(planRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update treatment plan');
      throw error;
    }
  };

  const deleteTreatmentPlan = async (planId: string): Promise<void> => {
    try {
      // 関連する治療ステップも削除する必要がある
      const stepsQuery = query(
        collection(db, 'treatmentSteps'),
        where('treatmentPlanId', '==', planId)
      );
      
      // 実際の実装では、バッチ処理で削除するのが良い
      const planRef = doc(db, 'treatmentPlans', planId);
      await deleteDoc(planRef);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete treatment plan');
      throw error;
    }
  };

  const updateTreatmentPlanStatus = async (
    planId: string,
    status: TreatmentPlan['status']
  ): Promise<void> => {
    try {
      const planRef = doc(db, 'treatmentPlans', planId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'completed') {
        updateData.completedDate = new Date().toISOString().split('T')[0];
      }

      await updateDoc(planRef, updateData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update treatment plan status');
      throw error;
    }
  };

  const getTreatmentPlanById = useCallback((planId: string): TreatmentPlan | undefined => {
    return treatmentPlans.find(plan => plan.id === planId);
  }, [treatmentPlans]);

  const getTreatmentPlansByPatient = useCallback((patientId: string): TreatmentPlan[] => {
    return treatmentPlans.filter(plan => plan.patientId === patientId);
  }, [treatmentPlans]);

  return {
    treatmentPlans,
    loading,
    error,
    createTreatmentPlan,
    updateTreatmentPlan,
    deleteTreatmentPlan,
    updateTreatmentPlanStatus,
    getTreatmentPlanById,
    getTreatmentPlansByPatient,
  };
};