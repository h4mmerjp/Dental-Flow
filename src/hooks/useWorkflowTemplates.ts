import { useState, useEffect, useCallback } from 'react';
import { 
  WorkflowTemplate, 
  WorkflowTemplateFilter,
  WorkflowTemplateSaveRequest,
  EditSession
} from '../types/patientWorkflow';
import { workflowTemplateService } from '../services/workflowTemplateService';
import { useAuth } from './useAuth';

export const useWorkflowTemplates = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [templateCounts, setTemplateCounts] = useState<{ [category: string]: number }>({});
  const { currentUser } = useAuth();

  // テンプレート一覧を取得
  const loadTemplates = useCallback(async (
    filter: WorkflowTemplateFilter = {},
    append: boolean = false
  ) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await workflowTemplateService.getTemplates(filter, currentUser?.uid);
      
      if (append) {
        setTemplates(prev => [...prev, ...result.templates]);
      } else {
        setTemplates(result.templates);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, currentUser?.uid]);

  // テンプレート数を取得
  const loadTemplateCounts = useCallback(async () => {
    try {
      const counts = await workflowTemplateService.getTemplateCounts(currentUser?.uid);
      setTemplateCounts(counts);
    } catch (err) {
      console.error('Error loading template counts:', err);
    }
  }, [currentUser?.uid]);

  // テンプレートの作成
  const createTemplate = useCallback(async (
    editSession: EditSession,
    saveRequest: WorkflowTemplateSaveRequest
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      const templateId = await workflowTemplateService.createFromEditSession(
        editSession,
        saveRequest,
        currentUser.uid
      );
      
      // 作成後、テンプレート一覧を更新
      await loadTemplates();
      await loadTemplateCounts();
      
      return templateId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの作成に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadTemplates, loadTemplateCounts]);

  // テンプレートの更新
  const updateTemplate = useCallback(async (
    templateId: string,
    updates: Partial<WorkflowTemplate>
  ): Promise<void> => {
    if (!currentUser) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      await workflowTemplateService.updateTemplate(templateId, updates);
      
      // 更新後、ローカルの状態を更新
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの更新に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // テンプレートの削除
  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('ユーザーが認証されていません');
    }

    setLoading(true);
    setError(null);

    try {
      await workflowTemplateService.deleteTemplate(templateId);
      
      // 削除後、ローカルの状態を更新
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      await loadTemplateCounts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの削除に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadTemplateCounts]);

  // テンプレートの取得（単一）
  const getTemplate = useCallback(async (templateId: string): Promise<WorkflowTemplate | null> => {
    setLoading(true);
    setError(null);

    try {
      const template = await workflowTemplateService.getTemplate(templateId);
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの取得に失敗しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // テンプレートの使用回数を増加
  const incrementUsageCount = useCallback(async (templateId: string): Promise<void> => {
    try {
      await workflowTemplateService.incrementUsageCount(templateId);
      
      // ローカルの状態を更新
      setTemplates(prev => prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              usageCount: template.usageCount + 1,
              lastUsedAt: new Date(),
              updatedAt: new Date()
            }
          : template
      ));
    } catch (err) {
      console.error('Error incrementing usage count:', err);
    }
  }, []);

  // テンプレート名の重複チェック
  const checkTemplateNameExists = useCallback(async (
    templateName: string,
    excludeId?: string
  ): Promise<boolean> => {
    if (!currentUser) {
      return false;
    }

    try {
      return await workflowTemplateService.checkTemplateNameExists(
        templateName,
        currentUser.uid,
        excludeId
      );
    } catch (err) {
      console.error('Error checking template name:', err);
      return false;
    }
  }, [currentUser]);

  // カテゴリによるフィルタリング
  const filterByCategory = useCallback((category: string) => {
    loadTemplates({ category });
  }, [loadTemplates]);

  // 検索
  const searchTemplates = useCallback((searchText: string) => {
    loadTemplates({ searchText });
  }, [loadTemplates]);

  // 初期データ読み込み
  useEffect(() => {
    if (currentUser) {
      loadTemplates();
      loadTemplateCounts();
    }
  }, [currentUser, loadTemplates, loadTemplateCounts]);

  return {
    templates,
    loading,
    error,
    hasMore,
    templateCounts,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    incrementUsageCount,
    checkTemplateNameExists,
    filterByCategory,
    searchTemplates,
    refresh: () => loadTemplates(),
  };
};