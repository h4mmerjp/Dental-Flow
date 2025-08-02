# 設計ドキュメント

## 概要

編集セッションをワークフローテンプレートとして保存・表示する機能を既存の歯科ワークフローシステムに統合する。この機能により、ユーザーは編集セッション中に作成した設定を永続化し、再利用可能なワークフローテンプレートとして管理できる。

## アーキテクチャ

### システム構成

```
Frontend (React/TypeScript)
├── Components
│   ├── EditSessionSaveDialog
│   ├── WorkflowTemplateList
│   └── WorkflowTemplateCard
├── Hooks
│   ├── useEditSessionSave
│   └── useWorkflowTemplates
├── Services
│   └── workflowTemplateService
└── Types
    └── workflowTemplate.ts

Backend (Firebase Firestore)
├── Collections
│   ├── workflowTemplates
│   └── editSessions (existing)
└── Security Rules
    └── workflowTemplates access rules
```

### データフロー

1. **編集セッション → テンプレート保存**
   - EditSession → SaveDialog → WorkflowTemplate → Firestore
   
2. **テンプレート表示・選択**
   - Firestore → WorkflowTemplateList → User Selection → PatientWorkflow

3. **テンプレート編集**
   - WorkflowTemplate → EditSession → Updated Template → Firestore

## コンポーネントとインターフェース

### 新しい型定義

```typescript
// src/types/workflowTemplate.ts
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  source: 'manual' | 'edit_session';
  
  // ワークフロー設定
  toothConditions: ToothConditions;
  workflowNodes: WorkflowNode[];
  settings: WorkflowSettings;
  scheduleSlots?: ScheduleSlot[];
  selectedTreatmentOptions?: SelectedTreatmentOptions;
  
  // メタデータ
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  originalEditSessionId?: string; // 編集セッション由来の場合
  usageCount: number;
  isPublic: boolean;
  tags: string[];
}

export interface WorkflowTemplateSaveRequest {
  name: string;
  description?: string;
  category: string;
  editSessionId: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface WorkflowTemplateFilter {
  category?: string;
  source?: 'manual' | 'edit_session';
  createdBy?: string;
  tags?: string[];
  searchText?: string;
}
```

### コンポーネント設計

#### 1. EditSessionSaveDialog
```typescript
interface EditSessionSaveDialogProps {
  editSession: EditSession;
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: WorkflowTemplateSaveRequest) => Promise<void>;
}
```

**責任:**
- 編集セッションの内容をプレビュー表示
- テンプレート名、説明、カテゴリの入力フォーム
- 保存処理の実行とエラーハンドリング

#### 2. WorkflowTemplateList
```typescript
interface WorkflowTemplateListProps {
  templates: WorkflowTemplate[];
  filter: WorkflowTemplateFilter;
  onFilterChange: (filter: WorkflowTemplateFilter) => void;
  onTemplateSelect: (template: WorkflowTemplate) => void;
  onTemplateEdit: (template: WorkflowTemplate) => void;
  onTemplateDelete: (templateId: string) => void;
}
```

**責任:**
- ワークフローテンプレートの一覧表示
- フィルタリング機能
- テンプレートの選択、編集、削除アクション

#### 3. WorkflowTemplateCard
```typescript
interface WorkflowTemplateCardProps {
  template: WorkflowTemplate;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showActions?: boolean;
}
```

**責任:**
- 個別テンプレートの表示
- ソース（手動作成 vs 編集セッション由来）の視覚的区別
- アクションボタンの表示

### サービス層設計

#### WorkflowTemplateService
```typescript
class WorkflowTemplateService {
  // 編集セッションからテンプレート作成
  async createFromEditSession(
    editSessionId: string, 
    request: WorkflowTemplateSaveRequest
  ): Promise<WorkflowTemplate>
  
  // テンプレート一覧取得
  async getTemplates(
    filter?: WorkflowTemplateFilter
  ): Promise<WorkflowTemplate[]>
  
  // テンプレート更新
  async updateTemplate(
    templateId: string, 
    updates: Partial<WorkflowTemplate>
  ): Promise<void>
  
  // テンプレート削除
  async deleteTemplate(templateId: string): Promise<void>
  
  // テンプレートから患者ワークフロー作成
  async createPatientWorkflowFromTemplate(
    templateId: string, 
    patientId: string
  ): Promise<PatientWorkflow>
  
  // 使用回数の更新
  async incrementUsageCount(templateId: string): Promise<void>
}
```

## データモデル

### Firestore Collection: workflowTemplates

```typescript
// Document structure
{
  id: string,
  name: string,
  description?: string,
  category: string,
  source: 'manual' | 'edit_session',
  
  // ワークフロー設定（EditSessionから複製）
  toothConditions: ToothConditions,
  workflowNodes: WorkflowNode[],
  settings: WorkflowSettings,
  scheduleSlots?: ScheduleSlot[],
  selectedTreatmentOptions?: SelectedTreatmentOptions,
  
  // メタデータ
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string,
  originalEditSessionId?: string,
  usageCount: number,
  isPublic: boolean,
  tags: string[]
}
```

### インデックス設計
- `createdBy` + `createdAt` (ユーザー別テンプレート取得)
- `category` + `createdAt` (カテゴリ別フィルタリング)
- `source` + `createdAt` (ソース別フィルタリング)
- `isPublic` + `createdAt` (公開テンプレート取得)

## エラーハンドリング

### エラーケース
1. **保存時エラー**
   - ネットワークエラー
   - 権限不足
   - データ検証エラー
   - 重複名エラー

2. **読み込み時エラー**
   - テンプレートが見つからない
   - 権限不足
   - データ破損

3. **削除時エラー**
   - 権限不足
   - 使用中テンプレートの削除

### エラーハンドリング戦略
- ユーザーフレンドリーなエラーメッセージ
- 自動リトライ機能（ネットワークエラー）
- ローカルキャッシュによる一時的な表示継続
- エラーログの記録

## テスト戦略

### 単体テスト
- WorkflowTemplateService の各メソッド
- コンポーネントの状態管理
- データ変換ロジック

### 統合テスト
- 編集セッション → テンプレート保存フロー
- テンプレート → 患者ワークフロー作成フロー
- Firestore との連携

### E2Eテスト
- 編集セッションからテンプレート保存
- テンプレート一覧表示・フィルタリング
- テンプレートを使用した患者ワークフロー作成

## セキュリティ考慮事項

### Firestore Security Rules
```javascript
// workflowTemplates collection
match /workflowTemplates/{templateId} {
  // 読み取り: 作成者または公開テンプレート
  allow read: if resource.data.createdBy == request.auth.uid 
              || resource.data.isPublic == true;
  
  // 作成: 認証済みユーザー
  allow create: if request.auth != null 
                && request.auth.uid == request.resource.data.createdBy;
  
  // 更新・削除: 作成者のみ
  allow update, delete: if request.auth.uid == resource.data.createdBy;
}
```

### データ検証
- テンプレート名の重複チェック
- 必須フィールドの検証
- データサイズ制限
- XSS対策（入力値のサニタイズ）

## パフォーマンス最適化

### フロントエンド
- テンプレート一覧の仮想化（大量データ対応）
- 画像・プレビューの遅延読み込み
- キャッシュ戦略（React Query使用）

### バックエンド
- Firestore クエリの最適化
- 複合インデックスの適切な設計
- ページネーション実装

## 今後の拡張性

### Phase 2 機能
- テンプレートの共有機能
- バージョン管理
- テンプレートのインポート/エクスポート
- 使用統計とレコメンデーション

### 技術的拡張
- オフライン対応
- リアルタイム同期
- 外部システム連携API