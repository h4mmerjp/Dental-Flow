import { useState, useCallback } from 'react';
import { 
  EditSession, 
  WorkflowTemplateSaveRequest,
  WORKFLOW_TEMPLATE_CATEGORIES
} from '../types/patientWorkflow';
import { useWorkflowTemplates } from './useWorkflowTemplates';
import { useAuth } from './useAuth';

interface EditSessionSaveState {
  loading: boolean;
  error: string | null;
  success: boolean;
  showDialog: boolean;
  formData: WorkflowTemplateSaveRequest;
  validationErrors: { [key: string]: string };
}

export const useEditSessionSave = () => {
  const [state, setState] = useState<EditSessionSaveState>({
    loading: false,
    error: null,
    success: false,
    showDialog: false,
    formData: {
      templateName: '',
      category: 'general',
      description: '',
      tags: [],
      isPublic: false,
      sourceType: 'edit_session',
      sourceId: ''
    },
    validationErrors: {}
  });

  const { createTemplate, checkTemplateNameExists } = useWorkflowTemplates();
  const { currentUser } = useAuth();

  // ダイアログを開く
  const openDialog = useCallback((editSession: EditSession) => {
    const defaultTemplateName = `${editSession.sessionName} テンプレート`;
    
    setState(prev => ({
      ...prev,
      showDialog: true,
      formData: {
        ...prev.formData,
        templateName: defaultTemplateName,
        description: `${editSession.sessionName}から作成されたワークフローテンプレート`,
        sourceId: editSession.id
      },
      validationErrors: {},
      error: null,
      success: false
    }));
  }, []);

  // ダイアログを閉じる
  const closeDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDialog: false,
      success: false,
      error: null,
      validationErrors: {}
    }));
  }, []);

  // フォームデータの更新
  const updateFormData = useCallback((updates: Partial<WorkflowTemplateSaveRequest>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      validationErrors: {},
      error: null
    }));
  }, []);

  // タグの追加
  const addTag = useCallback((tag: string) => {
    if (tag.trim() && !state.formData.tags.includes(tag.trim())) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          tags: [...prev.formData.tags, tag.trim()]
        }
      }));
    }
  }, [state.formData.tags]);

  // タグの削除
  const removeTag = useCallback((tagToRemove: string) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        tags: prev.formData.tags.filter(tag => tag !== tagToRemove)
      }
    }));
  }, []);

  // バリデーション
  const validateForm = useCallback(async (): Promise<boolean> => {
    const errors: { [key: string]: string } = {};

    // テンプレート名の検証
    if (!state.formData.templateName.trim()) {
      errors.templateName = 'テンプレート名は必須です';
    } else if (state.formData.templateName.length > 100) {
      errors.templateName = 'テンプレート名は100文字以内で入力してください';
    } else if (currentUser) {
      // 重複チェック
      const exists = await checkTemplateNameExists(state.formData.templateName.trim());
      if (exists) {
        errors.templateName = '同じ名前のテンプレートが既に存在します';
      }
    }

    // カテゴリの検証
    if (!state.formData.category) {
      errors.category = 'カテゴリは必須です';
    } else if (!WORKFLOW_TEMPLATE_CATEGORIES.some(cat => cat.value === state.formData.category)) {
      errors.category = '無効なカテゴリです';
    }

    // 説明の検証
    if (state.formData.description && state.formData.description.length > 500) {
      errors.description = '説明は500文字以内で入力してください';
    }

    // タグの検証
    if (state.formData.tags.length > 10) {
      errors.tags = 'タグは10個まで設定できます';
    }

    setState(prev => ({
      ...prev,
      validationErrors: errors
    }));

    return Object.keys(errors).length === 0;
  }, [state.formData, currentUser, checkTemplateNameExists]);

  // 保存処理
  const saveTemplate = useCallback(async (editSession: EditSession): Promise<string | null> => {
    if (!currentUser) {
      setState(prev => ({
        ...prev,
        error: 'ユーザーが認証されていません'
      }));
      return null;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // バリデーション
      const isValid = await validateForm();
      if (!isValid) {
        setState(prev => ({
          ...prev,
          loading: false
        }));
        return null;
      }

      // テンプレート作成
      const templateId = await createTemplate(editSession, state.formData);

      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
        error: null
      }));

      return templateId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'テンプレートの保存に失敗しました';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return null;
    }
  }, [currentUser, validateForm, createTemplate, state.formData]);

  // テンプレート名の重複チェック（リアルタイム）
  const checkTemplateName = useCallback(async (templateName: string): Promise<boolean> => {
    if (!currentUser || !templateName.trim()) {
      return false;
    }

    try {
      return await checkTemplateNameExists(templateName.trim());
    } catch (error) {
      console.error('Error checking template name:', error);
      return false;
    }
  }, [currentUser, checkTemplateNameExists]);

  // フォームのリセット
  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: {
        templateName: '',
        category: 'general',
        description: '',
        tags: [],
        isPublic: false,
        sourceType: 'edit_session',
        sourceId: ''
      },
      validationErrors: {},
      error: null,
      success: false
    }));
  }, []);

  return {
    // 状態
    loading: state.loading,
    error: state.error,
    success: state.success,
    showDialog: state.showDialog,
    formData: state.formData,
    validationErrors: state.validationErrors,

    // アクション
    openDialog,
    closeDialog,
    updateFormData,
    addTag,
    removeTag,
    saveTemplate,
    checkTemplateName,
    resetForm,
    validateForm,

    // 設定項目
    categories: WORKFLOW_TEMPLATE_CATEGORIES,
  };
};