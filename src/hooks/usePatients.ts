import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Patient, PatientFormData } from '../types/patient';

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const patientsCollection = collection(db, 'patients');
    const patientsQuery = query(patientsCollection, orderBy('patientId', 'asc'));

    const unsubscribe = onSnapshot(
      patientsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const patientsData: Patient[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Patient[];
          
          setPatients(patientsData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to process patient data'));
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err instanceof Error ? err : new Error('Failed to fetch patients'));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const addPatient = async (patientData: PatientFormData): Promise<void> => {
    try {
      const patientsCollection = collection(db, 'patients');
      await addDoc(patientsCollection, {
        ...patientData,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add patient');
      throw error;
    }
  };

  const fetchPatients = async (): Promise<void> => {
    // This function is now handled by the real-time listener
    // but kept for API consistency
  };

  return {
    patients,
    loading,
    error,
    fetchPatients,
    addPatient,
  };
};