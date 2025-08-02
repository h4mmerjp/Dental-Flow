import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { EditSession } from '../types/patientWorkflow';

export class EditSessionService {
  private static readonly COLLECTION_NAME = 'editSessions';

  /**
   * 編集セッションを作成
   */
  static async createEditSession(sessionData: Omit<EditSession, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...sessionData,
        createdAt: Timestamp.fromDate(new Date(sessionData.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(sessionData.updatedAt)),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating edit session:', error);
      throw new Error('編集セッションの作成に失敗しました');
    }
  }

  /**
   * 編集セッション一覧を取得
   */
  static async getEditSessions(
    patientId?: string,
    limitCount: number = 50
  ): Promise<EditSession[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      if (patientId) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          where('patientId', '==', patientId),
          orderBy('updatedAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as EditSession[];
    } catch (error) {
      console.error('Error getting edit sessions:', error);
      throw new Error('編集セッション一覧の取得に失敗しました');
    }
  }

  /**
   * 特定の編集セッションを取得
   */
  static async getEditSession(sessionId: string): Promise<EditSession | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate(),
        } as EditSession;
      }
      return null;
    } catch (error) {
      console.error('Error getting edit session:', error);
      throw new Error('編集セッションの取得に失敗しました');
    }
  }

  /**
   * 編集セッションを更新
   */
  static async updateEditSession(
    sessionId: string, 
    updates: Partial<EditSession>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating edit session:', error);
      throw new Error('編集セッションの更新に失敗しました');
    }
  }

  /**
   * 編集セッションを削除
   */
  static async deleteEditSession(sessionId: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, sessionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting edit session:', error);
      throw new Error('編集セッションの削除に失敗しました');
    }
  }

  /**
   * 複数の編集セッションを一括削除
   */
  static async deleteEditSessions(sessionIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      sessionIds.forEach(sessionId => {
        const docRef = doc(db, this.COLLECTION_NAME, sessionId);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting edit sessions:', error);
      throw new Error('編集セッションの一括削除に失敗しました');
    }
  }

  /**
   * 特定のユーザーの編集セッションを取得
   */
  static async getEditSessionsByUser(
    userId: string,
    limitCount: number = 50
  ): Promise<EditSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('createdBy', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as EditSession[];
    } catch (error) {
      console.error('Error getting edit sessions by user:', error);
      throw new Error('ユーザーの編集セッション一覧の取得に失敗しました');
    }
  }

  /**
   * 編集セッションの統計を取得
   */
  static async getEditSessionStats(userId?: string): Promise<{
    totalSessions: number;
    recentSessions: number;
    avgSessionsPerDay: number;
  }> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));
      
      if (userId) {
        q = query(
          collection(db, this.COLLECTION_NAME),
          where('createdBy', '==', userId)
        );
      }

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));

      const totalSessions = sessions.length;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentSessions = sessions.filter(session => 
        session.createdAt > sevenDaysAgo
      ).length;

      const avgSessionsPerDay = totalSessions > 0 ? 
        recentSessions / 7 : 0;

      return {
        totalSessions,
        recentSessions,
        avgSessionsPerDay: Math.round(avgSessionsPerDay * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting edit session stats:', error);
      throw new Error('編集セッション統計の取得に失敗しました');
    }
  }

  /**
   * 古い編集セッションを自動削除
   */
  static async cleanupOldSessions(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('updatedAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      const sessionsToDelete = querySnapshot.docs.map(doc => doc.id);

      if (sessionsToDelete.length > 0) {
        await this.deleteEditSessions(sessionsToDelete);
      }

      return sessionsToDelete.length;
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      throw new Error('古い編集セッションの削除に失敗しました');
    }
  }

  /**
   * 編集セッションの重複チェック
   */
  static async checkDuplicateSession(
    sessionName: string,
    patientId: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('sessionName', '==', sessionName),
        where('patientId', '==', patientId)
      );

      const querySnapshot = await getDocs(q);
      
      if (excludeId) {
        return querySnapshot.docs.some(doc => doc.id !== excludeId);
      }
      
      return querySnapshot.docs.length > 0;
    } catch (error) {
      console.error('Error checking duplicate session:', error);
      throw new Error('重複チェックに失敗しました');
    }
  }
}