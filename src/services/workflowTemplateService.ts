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
  startAfter,
  Timestamp,
  increment,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  WorkflowTemplate, 
  WorkflowTemplateSaveRequest, 
  WorkflowTemplateFilter,
  EditSession
} from '../types/patientWorkflow';

export class WorkflowTemplateService {
  private static instance: WorkflowTemplateService;
  private readonly collectionName = 'workflowTemplates';

  static getInstance(): WorkflowTemplateService {
    if (!WorkflowTemplateService.instance) {
      WorkflowTemplateService.instance = new WorkflowTemplateService();
    }
    return WorkflowTemplateService.instance;
  }

  /**
   * 編集セッションからワークフローテンプレートを作成
   */
  async createFromEditSession(
    editSession: EditSession,
    saveRequest: WorkflowTemplateSaveRequest,
    createdBy: string
  ): Promise<string> {
    try {
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const templateRef = doc(db, this.collectionName, templateId);
      
      const template: WorkflowTemplate = {
        id: templateId,
        templateName: saveRequest.templateName,
        category: saveRequest.category,
        description: saveRequest.description,
        tags: saveRequest.tags,
        
        // ワークフロー内容を編集セッションからコピー
        toothConditions: editSession.toothConditions,
        workflowNodes: editSession.workflowNodes,
        scheduleSlots: editSession.scheduleSlots,
        selectedTreatmentOptions: editSession.selectedTreatmentOptions,
        settings: editSession.settings,
        
        // ソース情報
        sourceType: 'edit_session',
        sourceId: editSession.id,
        originalPatientId: editSession.patientId,
        
        // 統計情報
        usageCount: 0,
        lastUsedAt: undefined,
        
        // メタデータ
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        
        // 公開設定
        isPublic: saveRequest.isPublic,
        isDefault: false
      };

      await setDoc(templateRef, {
        ...template,
        createdAt: Timestamp.fromDate(template.createdAt),
        updatedAt: Timestamp.fromDate(template.updatedAt)
      });

      return templateId;
    } catch (error) {
      console.error('Error creating workflow template from edit session:', error);
      throw new Error('テンプレートの作成に失敗しました');
    }
  }

  /**
   * ワークフローテンプレートの取得（単一）
   */
  async getTemplate(templateId: string): Promise<WorkflowTemplate | null> {
    try {
      const templateRef = doc(db, this.collectionName, templateId);
      const templateDoc = await getDoc(templateRef);

      if (!templateDoc.exists()) {
        return null;
      }

      const data = templateDoc.data();
      return {
        ...data,
        id: templateDoc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastUsedAt: data.lastUsedAt?.toDate() || undefined
      } as WorkflowTemplate;
    } catch (error) {
      console.error('Error getting workflow template:', error);
      throw new Error('テンプレートの取得に失敗しました');
    }
  }

  /**
   * ワークフローテンプレートの一覧取得（フィルタリング対応）
   */
  async getTemplates(
    filter: WorkflowTemplateFilter = {},
    userId?: string
  ): Promise<{
    templates: WorkflowTemplate[];
    hasMore: boolean;
    lastDoc?: DocumentSnapshot;
  }> {
    try {
      const templatesRef = collection(db, this.collectionName);
      let q = query(templatesRef);

      // フィルタリング条件を追加
      if (filter.category) {
        q = query(q, where('category', '==', filter.category));
      }

      if (filter.sourceType) {
        q = query(q, where('sourceType', '==', filter.sourceType));
      }

      if (filter.isPublic !== undefined) {
        q = query(q, where('isPublic', '==', filter.isPublic));
      }

      // 公開テンプレートまたは自分が作成したテンプレートのみ表示
      if (userId) {
        // TODO: より複雑なクエリが必要な場合は、複数のクエリを組み合わせる
        if (filter.createdBy) {
          q = query(q, where('createdBy', '==', filter.createdBy));
        }
      }

      // ソート
      const sortBy = filter.sortBy || 'updated_at';
      const sortOrder = filter.sortOrder || 'desc';
      
      if (sortBy === 'created_at') {
        q = query(q, orderBy('createdAt', sortOrder));
      } else if (sortBy === 'updated_at') {
        q = query(q, orderBy('updatedAt', sortOrder));
      } else if (sortBy === 'usage_count') {
        q = query(q, orderBy('usageCount', sortOrder));
      } else if (sortBy === 'name') {
        q = query(q, orderBy('templateName', sortOrder));
      }

      // 制限
      const limitCount = filter.limit || 20;
      q = query(q, limit(limitCount + 1)); // +1 for hasMore check

      const querySnapshot = await getDocs(q);
      const templates: WorkflowTemplate[] = [];
      const docs = querySnapshot.docs;

      // hasMoreの判定
      const hasMore = docs.length > limitCount;
      const templatesData = hasMore ? docs.slice(0, limitCount) : docs;

      templatesData.forEach((doc) => {
        const data = doc.data();
        templates.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastUsedAt: data.lastUsedAt?.toDate() || undefined
        } as WorkflowTemplate);
      });

      // 検索テキストによるフィルタリング（クライアントサイド）
      let filteredTemplates = templates;
      if (filter.searchText) {
        const searchText = filter.searchText.toLowerCase();
        filteredTemplates = templates.filter(template => 
          template.templateName.toLowerCase().includes(searchText) ||
          template.description?.toLowerCase().includes(searchText) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchText))
        );
      }

      return {
        templates: filteredTemplates,
        hasMore,
        lastDoc: hasMore ? docs[limitCount - 1] : undefined
      };
    } catch (error) {
      console.error('Error getting workflow templates:', error);
      throw new Error('テンプレート一覧の取得に失敗しました');
    }
  }

  /**
   * ワークフローテンプレートの更新
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<WorkflowTemplate>
  ): Promise<void> {
    try {
      const templateRef = doc(db, this.collectionName, templateId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      await updateDoc(templateRef, updateData);
    } catch (error) {
      console.error('Error updating workflow template:', error);
      throw new Error('テンプレートの更新に失敗しました');
    }
  }

  /**
   * ワークフローテンプレートの削除
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, this.collectionName, templateId);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      throw new Error('テンプレートの削除に失敗しました');
    }
  }

  /**
   * テンプレートの使用回数を増加
   */
  async incrementUsageCount(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, this.collectionName, templateId);
      await updateDoc(templateRef, {
        usageCount: increment(1),
        lastUsedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw new Error('使用回数の更新に失敗しました');
    }
  }

  /**
   * テンプレート名の重複チェック
   */
  async checkTemplateNameExists(
    templateName: string,
    createdBy: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const templatesRef = collection(db, this.collectionName);
      let q = query(
        templatesRef,
        where('templateName', '==', templateName),
        where('createdBy', '==', createdBy)
      );

      const querySnapshot = await getDocs(q);
      
      if (excludeId) {
        return querySnapshot.docs.some(doc => doc.id !== excludeId);
      }
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking template name:', error);
      throw new Error('テンプレート名の確認に失敗しました');
    }
  }

  /**
   * カテゴリ別のテンプレート数を取得
   */
  async getTemplateCounts(userId?: string): Promise<{ [category: string]: number }> {
    try {
      const templatesRef = collection(db, this.collectionName);
      let q = query(templatesRef);

      if (userId) {
        // 公開テンプレートまたは自分が作成したテンプレートのみ
        // TODO: より複雑なクエリが必要
      }

      const querySnapshot = await getDocs(q);
      const counts: { [category: string]: number } = {};

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const category = data.category || 'other';
        counts[category] = (counts[category] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Error getting template counts:', error);
      throw new Error('テンプレート数の取得に失敗しました');
    }
  }
}

// シングルトンインスタンスをエクスポート
export const workflowTemplateService = WorkflowTemplateService.getInstance();