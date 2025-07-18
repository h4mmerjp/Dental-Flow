import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { EditSession } from '../types/patientWorkflow';
import { useAuth } from './useAuth';

export const useEditSessions = () => {
  const [editSessions, setEditSessions] = useState<EditSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser: user } = useAuth();

  // コレクション参照
  const editSessionsRef = collection(db, 'editSessions');

  // 編集セッションの作成
  const createEditSession = async (sessionData: Omit<EditSession, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const sessionId = `${sessionData.patientId}_${Date.now()}`;
      const sessionDocRef = doc(editSessionsRef, sessionId);
      
      const newSession: EditSession = {
        ...sessionData,
        id: sessionId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(sessionDocRef, {
        ...newSession,
        createdAt: Timestamp.fromDate(newSession.createdAt),
        updatedAt: Timestamp.fromDate(newSession.updatedAt),
        createdBy: user.uid
      });

      setEditSessions(prev => [...prev, newSession]);
      
      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '編集セッションの作成に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 編集セッションの更新
  const updateEditSession = async (sessionId: string, updates: Partial<EditSession>) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const sessionDocRef = doc(editSessionsRef, sessionId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(sessionDocRef, updateData);

      setEditSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, ...updates, updatedAt: new Date() }
            : session
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '編集セッションの更新に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 編集セッションの削除
  const deleteEditSession = async (sessionId: string) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const sessionDocRef = doc(editSessionsRef, sessionId);
      await deleteDoc(sessionDocRef);

      setEditSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '編集セッションの削除に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 編集セッションの取得（単一）
  const getEditSession = async (sessionId: string) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const sessionDocRef = doc(editSessionsRef, sessionId);
      const sessionDoc = await getDoc(sessionDocRef);

      if (!sessionDoc.exists()) {
        throw new Error('編集セッションが見つかりません');
      }

      const data = sessionDoc.data();
      const session: EditSession = {
        ...data,
        id: sessionDoc.id,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as EditSession;

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '編集セッションの取得に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 患者別編集セッションの取得
  const getEditSessionsByPatient = async (patientId: string) => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        editSessionsRef,
        where('patientId', '==', patientId),
        where('createdBy', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessions: EditSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as EditSession);
      });

      setEditSessions(sessions);
      return sessions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '編集セッションの取得に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 全編集セッションの取得
  const getAllEditSessions = async () => {
    if (!user) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        editSessionsRef,
        where('createdBy', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const sessions: EditSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as EditSession);
      });

      setEditSessions(sessions);
      return sessions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '編集セッションの取得に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    editSessions,
    loading,
    error,
    createEditSession,
    updateEditSession,
    deleteEditSession,
    getEditSession,
    getEditSessionsByPatient,
    getAllEditSessions
  };
};