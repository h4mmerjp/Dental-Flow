import { WorkflowNode, WorkflowSettings, ToothConditions, SelectedTreatmentOptions } from './dentalWorkflow';
import { ScheduleSlot, EditSession } from './patientWorkflow';

/**
 * ワークフローテンプレートのソース種別
 * - 'manual': 手動で作成されたテンプレート
 * - 'edit_session': 編集セッションから保存されたテンプレート
 */
export type WorkflowTemplateSource = 'manual' | 'edit_session';

/**
 * ワークフローテンプレートのカテゴリ
 */
export type WorkflowTemplateCategory = 
  | 'general' 
  | 'endodontic' 
  | 'periodontal' 
  | 'prosthetic' 
  | 'oral_surgery' 
  | 'pediatric' 
  | 'orthodontic' 
  | 'custom';

/**
 * ワークフローテンプレートのメインインターフェース
 * 編集セッションや手動作成から保存されたワークフローテンプレートを表現
 */
export interface WorkflowTemplate {
  id: string;                           // Firestore document ID
  name: string;                         // テンプレート名
  description?: string;                 // テンプレートの説明
  category: WorkflowTemplateCategory;   // カテゴリ
  source: WorkflowTemplateSource;       // テンプレートのソース
  
  // ワークフロー内容
  toothConditions: ToothConditions;     // 歯の状態
  workflowNodes: WorkflowNode[];        // ワークフローノード
  settings: WorkflowSettings;           // ワークフロー設定
  
  // 編集セッション由来の場合の追加情報
  scheduleSlots?: ScheduleSlot[];       // スケジュールスロット
  selectedTreatmentOptions?: SelectedTreatmentOptions; // 選択された治療オプション
  
  // メタデータ
  tags?: string[];                      // タグ（検索・フィルタリング用）
  usageCount: number;                   // 使用回数
  isPublic: boolean;                    // 公開設定
  
  // 編集セッション関連メタデータ
  originalEditSessionId?: string;       // 元の編集セッションID（edit_session由来の場合）
  editSessionSnapshot?: Partial<EditSession>; // 編集セッションのスナップショット
  
  // 標準メタデータ
  createdAt: any;                       // Firestore Timestamp
  updatedAt: any;                       // Firestore Timestamp
  createdBy: string;                    // 作成者のUID
}

/**
 * ワークフローテンプレート保存リクエスト
 * 編集セッションからテンプレートを保存する際のリクエスト形式
 */
export interface WorkflowTemplateSaveRequest {
  name: string;                         // テンプレート名
  description?: string;                 // テンプレートの説明
  category: WorkflowTemplateCategory;   // カテゴリ
  tags?: string[];                      // タグ
  isPublic?: boolean;                   // 公開設定（デフォルト: false）
  
  // 編集セッション情報
  editSessionId: string;                // 保存元の編集セッションID
  editSession: EditSession;             // 編集セッションの完全なデータ
}

/**
 * ワークフローテンプレートフィルター
 * テンプレート一覧の検索・フィルタリング用
 */
export interface WorkflowTemplateFilter {
  category?: WorkflowTemplateCategory | WorkflowTemplateCategory[]; // カテゴリフィルター
  source?: WorkflowTemplateSource | WorkflowTemplateSource[];       // ソースフィルター
  createdBy?: string | string[];       // 作成者フィルター
  tags?: string | string[];            // タグフィルター
  searchText?: string;                 // テキスト検索
  isPublic?: boolean;                  // 公開設定フィルター
  dateRange?: {                        // 作成日時範囲
    from?: Date;
    to?: Date;
  };
}

/**
 * ワークフローテンプレート更新リクエスト
 * 既存テンプレートの更新用
 */
export interface WorkflowTemplateUpdateRequest {
  name?: string;
  description?: string;
  category?: WorkflowTemplateCategory;
  tags?: string[];
  isPublic?: boolean;
  
  // ワークフロー内容の更新（オプション）
  toothConditions?: ToothConditions;
  workflowNodes?: WorkflowNode[];
  settings?: WorkflowSettings;
  scheduleSlots?: ScheduleSlot[];
  selectedTreatmentOptions?: SelectedTreatmentOptions;
}

/**
 * カテゴリ表示用ラベル
 */
export const WORKFLOW_TEMPLATE_CATEGORY_LABELS: Record<WorkflowTemplateCategory, string> = {
  general: '一般',
  endodontic: '根管治療',
  periodontal: '歯周治療',
  prosthetic: '補綴治療',
  oral_surgery: '口腔外科',
  pediatric: '小児歯科',
  orthodontic: '矯正歯科',
  custom: 'カスタム',
};

/**
 * ソース表示用ラベル
 */
export const WORKFLOW_TEMPLATE_SOURCE_LABELS: Record<WorkflowTemplateSource, string> = {
  manual: '手動作成',
  edit_session: '編集セッション',
};

/**
 * カテゴリ色設定
 */
export const getWorkflowTemplateCategoryColor = (category: WorkflowTemplateCategory): string => {
  const colors: Record<WorkflowTemplateCategory, string> = {
    general: 'bg-blue-100 text-blue-800',
    endodontic: 'bg-red-100 text-red-800',
    periodontal: 'bg-purple-100 text-purple-800',
    prosthetic: 'bg-green-100 text-green-800',
    oral_surgery: 'bg-orange-100 text-orange-800',
    pediatric: 'bg-pink-100 text-pink-800',
    orthodontic: 'bg-indigo-100 text-indigo-800',
    custom: 'bg-gray-100 text-gray-800',
  };
  return colors[category];
};

/**
 * ソース色設定
 */
export const getWorkflowTemplateSourceColor = (source: WorkflowTemplateSource): string => {
  const colors: Record<WorkflowTemplateSource, string> = {
    manual: 'bg-blue-100 text-blue-800',
    edit_session: 'bg-amber-100 text-amber-800',
  };
  return colors[source];
};