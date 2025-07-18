import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc,
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
import { 
  SavedWorkflowSettings, 
  WorkflowSettingsFormData 
} from '../types/patientWorkflow';
import { DEFAULT_WORKFLOW_SETTINGS } from '../types/dentalWorkflow';

export const useWorkflowSettings = () => {
  const [savedSettings, setSavedSettings] = useState<SavedWorkflowSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const settingsCollection = collection(db, 'workflowSettings');
    const settingsQuery = query(
      settingsCollection,
      orderBy('isDefault', 'desc'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      settingsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const settingsData: SavedWorkflowSettings[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as SavedWorkflowSettings[];
          
          setSavedSettings(settingsData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to process settings'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err instanceof Error ? err : new Error('Failed to fetch settings'));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const saveSettings = async (
    settingsData: WorkflowSettingsFormData
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const settingsCollection = collection(db, 'workflowSettings');
      
      // If this is being set as default, remove default flag from other settings
      if (settingsData.isDefault) {
        await clearDefaultSettings();
      }
      
      const docRef = await addDoc(settingsCollection, {
        ...settingsData,
        isDefault: settingsData.isDefault || false,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save settings');
      throw error;
    }
  };

  const updateSettings = async (
    settingsId: string,
    updates: Partial<WorkflowSettingsFormData>
  ): Promise<void> => {
    try {
      // If this is being set as default, remove default flag from other settings
      if (updates.isDefault) {
        await clearDefaultSettings();
      }
      
      const settingsRef = doc(db, 'workflowSettings', settingsId);
      await updateDoc(settingsRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update settings');
      throw error;
    }
  };

  const deleteSettings = async (settingsId: string): Promise<void> => {
    try {
      const settingsRef = doc(db, 'workflowSettings', settingsId);
      await deleteDoc(settingsRef);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete settings');
      throw error;
    }
  };

  const setAsDefault = async (settingsId: string): Promise<void> => {
    try {
      // First, remove default flag from all other settings
      await clearDefaultSettings();
      
      // Then set this one as default
      const settingsRef = doc(db, 'workflowSettings', settingsId);
      await updateDoc(settingsRef, {
        isDefault: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set as default');
      throw error;
    }
  };

  const clearDefaultSettings = async (): Promise<void> => {
    try {
      const settingsCollection = collection(db, 'workflowSettings');
      const defaultQuery = query(
        settingsCollection,
        where('isDefault', '==', true)
      );
      
      // This is a simplified approach - in production, you'd want to use a batch write
      const snapshot = await new Promise<QuerySnapshot<DocumentData>>((resolve, reject) => {
        const unsubscribe = onSnapshot(defaultQuery, resolve, reject);
        // Clean up the listener immediately
        setTimeout(unsubscribe, 100);
      });
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { isDefault: false, updatedAt: serverTimestamp() })
      );
      
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Failed to clear default settings:', err);
    }
  };

  const getSettingsById = useCallback((settingsId: string): SavedWorkflowSettings | undefined => {
    return savedSettings.find(settings => settings.id === settingsId);
  }, [savedSettings]);

  const getDefaultSettings = useCallback((): SavedWorkflowSettings | undefined => {
    return savedSettings.find(settings => settings.isDefault);
  }, [savedSettings]);

  const getCurrentSettings = useCallback(() => {
    const defaultSettings = getDefaultSettings();
    return defaultSettings ? defaultSettings.settings : DEFAULT_WORKFLOW_SETTINGS;
  }, [getDefaultSettings]);

  return {
    savedSettings,
    loading,
    error,
    saveSettings,
    updateSettings,
    deleteSettings,
    setAsDefault,
    getSettingsById,
    getDefaultSettings,
    getCurrentSettings,
  };
};