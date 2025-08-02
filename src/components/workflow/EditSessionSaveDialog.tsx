import React, { useState, useEffect } from 'react';
import { X, Plus, Tag, Eye, Save, AlertCircle } from 'lucide-react';
import { EditSession } from '../../types/patientWorkflow';
import { useEditSessionSave } from '../../hooks/useEditSessionSave';

interface EditSessionSaveDialogProps {
  editSession: EditSession;
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateId: string) => void;
}

export const EditSessionSaveDialog: React.FC<EditSessionSaveDialogProps> = ({
  editSession,
  isOpen,
  onClose,
  onSave
}) => {
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    loading,
    error,
    success,
    formData,
    validationErrors,
    updateFormData,
    addTag,
    removeTag,
    saveTemplate,
    checkTemplateName,
    resetForm,
    categories
  } = useEditSessionSave();

  // ダイアログが開かれたときの初期設定
  useEffect(() => {
    if (isOpen) {
      resetForm();
      const defaultTemplateName = `${editSession.sessionName} テンプレート`;
      updateFormData({
        templateName: defaultTemplateName,
        description: `${editSession.sessionName}から作成されたワークフローテンプレート`,
        sourceId: editSession.id
      });
    }
  }, [isOpen, editSession, resetForm, updateFormData]);

  // 保存成功時の処理
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [success, onClose]);

  const handleSave = async () => {
    const templateId = await saveTemplate(editSession);
    if (templateId) {
      onSave(templateId);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      addTag(tagInput.trim());
      setTagInput('');
    }
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const getConditionsSummary = () => {
    const conditionCount = Object.keys(editSession.toothConditions).length;
    const nodeCount = editSession.workflowNodes.length;
    const slotCount = editSession.scheduleSlots.length;
    return `歯の状態: ${conditionCount}件, 治療ノード: ${nodeCount}件, スケジュール: ${slotCount}件`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">ワークフローテンプレートとして保存</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 編集セッション情報 */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">編集セッション: {editSession.sessionName}</h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? '詳細を隠す' : '詳細を表示'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">{getConditionsSummary()}</p>
          
          {showPreview && (
            <div className="mt-4 p-3 bg-white rounded border text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>作成日:</strong> {new Date(editSession.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>更新日:</strong> {new Date(editSession.updatedAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>患者ID:</strong> {editSession.patientId}
                </div>
                <div>
                  <strong>一時保存:</strong> {editSession.isTemporary ? 'はい' : 'いいえ'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フォーム */}
        <div className="p-6 space-y-4">
          {/* エラー表示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 成功表示 */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <Save className="w-4 h-4" />
              <span className="text-sm">テンプレートを保存しました！</span>
            </div>
          )}

          {/* テンプレート名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              テンプレート名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.templateName}
              onChange={(e) => updateFormData({ templateName: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.templateName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="テンプレート名を入力してください"
              disabled={loading}
            />
            {validationErrors.templateName && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.templateName}</p>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateFormData({ category: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="テンプレートの説明を入力してください"
              disabled={loading}
            />
            {validationErrors.description && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
            )}
          </div>

          {/* タグ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タグ
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="タグを入力してEnterで追加"
                disabled={loading}
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={loading || !tagInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-blue-600"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {validationErrors.tags && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.tags}</p>
            )}
          </div>

          {/* 公開設定 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => updateFormData({ isPublic: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              このテンプレートを公開する（他のユーザーも使用可能）
            </label>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={loading || !formData.templateName.trim()}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};