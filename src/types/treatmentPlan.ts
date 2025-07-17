export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export type TreatmentPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TreatmentCategory = 
  | 'preventive'      // 予防歯科
  | 'restorative'     // 修復治療
  | 'endodontic'      // 根管治療
  | 'periodontal'     // 歯周病治療
  | 'orthodontic'     // 矯正治療
  | 'oral_surgery'    // 口腔外科
  | 'prosthetic'      // 補綴治療
  | 'cosmetic'        // 美容歯科
  | 'other';          // その他

export interface TreatmentStep {
  id: string;
  treatmentPlanId: string;
  stepNumber: number;
  title: string;
  description: string;
  category: TreatmentCategory;
  toothNumbers?: string[];        // 対象歯番
  estimatedDuration: number;      // 予定時間（分）
  estimatedCost: number;          // 予定費用
  status: TreatmentStatus;
  priority: TreatmentPriority;
  prerequisites?: string[];       // 前提条件となるステップID
  scheduledDate?: string;         // 予定日 (YYYY-MM-DD)
  completedDate?: string;         // 完了日 (YYYY-MM-DD)
  notes?: string;                 // 備考
  createdAt: any;                 // Firestore Timestamp
  updatedAt: any;                 // Firestore Timestamp
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  description: string;
  status: TreatmentStatus;
  priority: TreatmentPriority;
  totalEstimatedCost: number;
  totalEstimatedDuration: number; // 総予定時間（分）
  startDate?: string;             // 開始日 (YYYY-MM-DD)
  endDate?: string;               // 終了日 (YYYY-MM-DD)
  completedDate?: string;         // 完了日 (YYYY-MM-DD)
  createdBy: string;              // 作成者のUID
  notes?: string;                 // 全体的な備考
  createdAt: any;                 // Firestore Timestamp
  updatedAt: any;                 // Firestore Timestamp
}

export interface TreatmentPlanFormData {
  title: string;
  description: string;
  priority: TreatmentPriority;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface TreatmentStepFormData {
  title: string;
  description: string;
  category: TreatmentCategory;
  toothNumbers?: string[];
  estimatedDuration: number;
  estimatedCost: number;
  priority: TreatmentPriority;
  scheduledDate?: string;
  notes?: string;
}

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  planned: '計画中',
  in_progress: '進行中',
  completed: '完了',
  cancelled: 'キャンセル',
  on_hold: '保留',
};

export const TREATMENT_PRIORITY_LABELS: Record<TreatmentPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急',
};

export const TREATMENT_CATEGORY_LABELS: Record<TreatmentCategory, string> = {
  preventive: '予防歯科',
  restorative: '修復治療',
  endodontic: '根管治療',
  periodontal: '歯周病治療',
  orthodontic: '矯正治療',
  oral_surgery: '口腔外科',
  prosthetic: '補綴治療',
  cosmetic: '美容歯科',
  other: 'その他',
};

export const TOOTH_NUMBERS = [
  '11', '12', '13', '14', '15', '16', '17', '18',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '31', '32', '33', '34', '35', '36', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48',
];

export const calculateTreatmentProgress = (steps: TreatmentStep[]): number => {
  if (steps.length === 0) return 0;
  
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  return Math.round((completedSteps / steps.length) * 100);
};

export const calculateTotalCost = (steps: TreatmentStep[]): number => {
  return steps.reduce((total, step) => total + step.estimatedCost, 0);
};

export const calculateTotalDuration = (steps: TreatmentStep[]): number => {
  return steps.reduce((total, step) => total + step.estimatedDuration, 0);
};

export const getStatusColor = (status: TreatmentStatus): string => {
  const colors: Record<TreatmentStatus, string> = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    on_hold: 'bg-gray-100 text-gray-800',
  };
  return colors[status];
};

export const getPriorityColor = (priority: TreatmentPriority): string => {
  const colors: Record<TreatmentPriority, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return colors[priority];
};