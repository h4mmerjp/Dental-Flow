import { useState, useEffect, useCallback } from 'react';
import { EditSession } from '../types/patientWorkflow';
import { EditSessionService } from '../services/editSessionService';
import { useAuth } from './useAuth';

interface PatientEditSessionSummary {
  patientId: string;
  totalSessions: number;
  latestSession: EditSession | null;
  hasRecentSessions: boolean;
  lastUpdated: Date | null;
}

export const usePatientEditSessions = (patientIds: string[]) => {
  const [sessionSummaries, setSessionSummaries] = useState<Map<string, PatientEditSessionSummary>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // ローカルストレージから編集セッションを取得
  const loadEditSessionsFromLocal = useCallback((): EditSession[] => {
    try {
      const savedSessions = localStorage.getItem('editSessions');
      if (savedSessions) {
        return JSON.parse(savedSessions) as EditSession[];
      }
      return [];
    } catch (error) {
      console.error('Error loading edit sessions from localStorage:', error);
      return [];
    }
  }, []);

  // 患者ごとの編集セッション情報を集計
  const aggregateSessionData = useCallback((sessions: EditSession[], patientIds: string[]) => {
    const summaries = new Map<string, PatientEditSessionSummary>();

    patientIds.forEach(patientId => {
      const patientSessions = sessions.filter(session => session.patientId === patientId);
      
      // 最新の更新日時順でソート
      const sortedSessions = patientSessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const latestSession = sortedSessions[0] || null;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const hasRecentSessions = latestSession ? 
        new Date(latestSession.updatedAt) > sevenDaysAgo : false;

      summaries.set(patientId, {
        patientId,
        totalSessions: patientSessions.length,
        latestSession,
        hasRecentSessions,
        lastUpdated: latestSession ? new Date(latestSession.updatedAt) : null
      });
    });

    return summaries;
  }, []);

  // 編集セッション情報を読み込み
  const loadSessionSummaries = useCallback(async () => {
    if (patientIds.length === 0) {
      setSessionSummaries(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let allSessions: EditSession[] = [];

      if (currentUser) {
        // Firestoreから取得
        try {
          allSessions = await EditSessionService.getEditSessions(undefined, 200);
        } catch (firestoreError) {
          console.warn('Firestore fetch failed, falling back to localStorage:', firestoreError);
          allSessions = loadEditSessionsFromLocal();
        }
      } else {
        // ローカルストレージから取得
        allSessions = loadEditSessionsFromLocal();
      }

      const summaries = aggregateSessionData(allSessions, patientIds);
      setSessionSummaries(summaries);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '編集セッション情報の取得に失敗しました';
      setError(errorMessage);
      console.error('Error loading session summaries:', error);
    } finally {
      setLoading(false);
    }
  }, [patientIds, currentUser, loadEditSessionsFromLocal, aggregateSessionData]);

  // 特定の患者の編集セッション一覧を取得
  const getPatientSessions = useCallback(async (patientId: string): Promise<EditSession[]> => {
    try {
      if (currentUser) {
        return await EditSessionService.getEditSessions(patientId);
      } else {
        const allSessions = loadEditSessionsFromLocal();
        return allSessions.filter(session => session.patientId === patientId);
      }
    } catch (error) {
      console.error('Error getting patient sessions:', error);
      return [];
    }
  }, [currentUser, loadEditSessionsFromLocal]);

  // 患者IDリストが変更されたときに再読み込み
  useEffect(() => {
    loadSessionSummaries();
  }, [loadSessionSummaries]);

  // 編集セッション情報を強制再読み込み
  const refreshSessionSummaries = useCallback(() => {
    loadSessionSummaries();
  }, [loadSessionSummaries]);

  // 特定の患者の編集セッション情報を取得
  const getPatientSessionSummary = useCallback((patientId: string): PatientEditSessionSummary | null => {
    return sessionSummaries.get(patientId) || null;
  }, [sessionSummaries]);

  // 編集セッションがある患者のIDリストを取得
  const getPatientsWithSessions = useCallback((): string[] => {
    return Array.from(sessionSummaries.entries())
      .filter(([_, summary]) => summary.totalSessions > 0)
      .map(([patientId]) => patientId);
  }, [sessionSummaries]);

  // 最近更新された編集セッションがある患者のIDリストを取得
  const getPatientsWithRecentSessions = useCallback((): string[] => {
    return Array.from(sessionSummaries.entries())
      .filter(([_, summary]) => summary.hasRecentSessions)
      .map(([patientId]) => patientId);
  }, [sessionSummaries]);

  return {
    sessionSummaries: Object.fromEntries(sessionSummaries),
    loading,
    error,
    getPatientSessions,
    getPatientSessionSummary,
    getPatientsWithSessions,
    getPatientsWithRecentSessions,
    refreshSessionSummaries
  };
};