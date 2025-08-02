import { WorkflowNode, WorkflowSettings, ToothConditions, SelectedTreatmentOptions } from './dentalWorkflow';

export interface ScheduleSlot {
  id: string;
  slotNumber: number;
  treatmentNodes: WorkflowNode[];
}

export interface WorkflowEditState {
  scheduleSlots: ScheduleSlot[];
  selectedTreatmentOptions: { [treatmentKey: string]: number };
  lastEditedAt: any; // Firestore Timestamp
}

/**
 * 患者ワークフロー
 * 特定の患者に適用される正式なワークフロー
 * EditSessionから作成されるか、ワークフローテンプレートから作成される
 */
export interface PatientWorkflow {
  id: string;                    // Firestore document ID
  patientId: string;             // Patient ID reference
  workflowTitle: string;         // Workflow name/title
  description?: string;          // Workflow description
  toothConditions: ToothConditions; // Current tooth conditions
  workflowNodes: WorkflowNode[]; // Generated workflow nodes
  settings: WorkflowSettings;    // Workflow settings used
  status: 'draft' | 'active' | 'completed' | 'paused'; // Workflow status
  editState?: WorkflowEditState; // Current editing state
  
  // ソース情報
  sourceType?: 'template' | 'edit_session' | 'manual'; // 作成元の種別
  sourceId?: string;             // 作成元のID（テンプレートIDまたは編集セッションID）
  
  // メタデータ
  createdAt: any;               // Firestore Timestamp
  updatedAt: any;               // Firestore Timestamp
  completedAt?: any;            // Completion timestamp
  createdBy: string;            // Creator's UID
}

export interface PatientWorkflowFormData {
  workflowTitle: string;
  description?: string;
  toothConditions: ToothConditions;
  settings?: Partial<WorkflowSettings>;
}

export interface SavedWorkflowSettings {
  id: string;                   // Firestore document ID
  name: string;                 // Settings name
  description?: string;         // Settings description
  settings: WorkflowSettings;   // Workflow settings
  isDefault: boolean;           // Is this the default setting
  createdAt: any;              // Firestore Timestamp
  updatedAt: any;              // Firestore Timestamp
  createdBy: string;           // Creator's UID
}

export interface WorkflowSettingsFormData {
  name: string;
  description?: string;
  settings: WorkflowSettings;
  isDefault?: boolean;
}

export const WORKFLOW_STATUS_LABELS: Record<PatientWorkflow['status'], string> = {
  draft: '下書き',
  active: '進行中',
  completed: '完了',
  paused: '一時停止',
};

export const getWorkflowStatusColor = (status: PatientWorkflow['status']): string => {
  const colors: Record<PatientWorkflow['status'], string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status];
};

/**
 * 編集セッション
 * 患者ワークフローの編集中の一時的な状態を保存
 * ワークフローテンプレートの保存元としても使用される
 */
export interface EditSession {
  id: string;                           // セッションID
  sessionName: string;                  // セッション名
  patientId: string;                    // 患者ID
  toothConditions: ToothConditions;     // 歯の状態
  workflowNodes: WorkflowNode[];        // ワークフローノード
  scheduleSlots: ScheduleSlot[];        // スケジュールスロット
  selectedTreatmentOptions: SelectedTreatmentOptions; // 選択された治療オプション
  settings: WorkflowSettings;           // ワークフロー設定
  
  // メタデータ
  createdAt: Date;                      // 作成日時
  updatedAt: Date;                      // 更新日時
  createdBy?: string;                   // 作成者のUID
  
  // 元ワークフロー情報（既存ワークフローから編集を開始した場合）
  originalWorkflowId?: string;          // 元のPatientWorkflowのID
  isTemporary: boolean;                 // 一時的なセッションかどうか
}

/**
 * ワークフローテンプレート
 * 編集セッションから作成された再利用可能なワークフロー
 */
export interface WorkflowTemplate {
  id: string;                           // テンプレートID
  templateName: string;                 // テンプレート名
  category: string;                     // カテゴリ
  description?: string;                 // 説明
  tags: string[];                       // タグ
  
  // ワークフロー内容
  toothConditions: ToothConditions;     // 歯の状態
  workflowNodes: WorkflowNode[];        // ワークフローノード
  scheduleSlots: ScheduleSlot[];        // スケジュールスロット
  selectedTreatmentOptions: SelectedTreatmentOptions; // 選択された治療オプション
  settings: WorkflowSettings;           // ワークフロー設定
  
  // ソース情報
  sourceType: 'edit_session' | 'manual'; // 作成元の種別
  sourceId?: string;                    // 作成元のID（編集セッションIDなど）
  originalPatientId?: string;           // 元の患者ID（編集セッションから作成した場合）
  
  // 統計情報
  usageCount: number;                   // 使用回数
  lastUsedAt?: Date;                    // 最終使用日時
  
  // メタデータ
  createdAt: Date;                      // 作成日時
  updatedAt: Date;                      // 更新日時
  createdBy: string;                    // 作成者のUID
  
  // 公開設定
  isPublic: boolean;                    // 公開テンプレートかどうか
  isDefault: boolean;                   // デフォルトテンプレートかどうか
}

/**
 * ワークフローテンプレート保存リクエスト
 */
export interface WorkflowTemplateSaveRequest {
  templateName: string;                 // テンプレート名
  category: string;                     // カテゴリ
  description?: string;                 // 説明
  tags: string[];                       // タグ
  isPublic: boolean;                    // 公開設定
  sourceType: 'edit_session' | 'manual'; // 作成元の種別
  sourceId?: string;                    // 作成元のID
}

/**
 * ワークフローテンプレートフィルター
 */
export interface WorkflowTemplateFilter {
  category?: string;                    // カテゴリフィルター
  sourceType?: 'edit_session' | 'manual'; // ソース種別フィルター
  createdBy?: string;                   // 作成者フィルター
  isPublic?: boolean;                   // 公開テンプレートフィルター
  searchText?: string;                  // 検索テキスト
  tags?: string[];                      // タグフィルター
  sortBy?: 'created_at' | 'updated_at' | 'usage_count' | 'name'; // ソート方法
  sortOrder?: 'asc' | 'desc';           // ソート順
  limit?: number;                       // 取得件数制限
  offset?: number;                      // オフセット
}

/**
 * ワークフローテンプレートカテゴリ
 */
export const WORKFLOW_TEMPLATE_CATEGORIES = [
  { value: 'general', label: '一般治療' },
  { value: 'emergency', label: '緊急治療' },
  { value: 'pediatric', label: '小児治療' },
  { value: 'orthodontic', label: '矯正治療' },
  { value: 'oral_surgery', label: '口腔外科' },
  { value: 'periodontic', label: '歯周治療' },
  { value: 'endodontic', label: '根管治療' },
  { value: 'prosthetic', label: '補綴治療' },
  { value: 'preventive', label: '予防処置' },
  { value: 'other', label: 'その他' }
] as const;

/**
 * ワークフローテンプレートのソース種別ラベル
 */
export const WORKFLOW_TEMPLATE_SOURCE_LABELS = {
  edit_session: '編集セッション',
  manual: '手動作成'
} as const;