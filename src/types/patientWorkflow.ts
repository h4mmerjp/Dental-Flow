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

export interface EditSession {
  id: string;
  sessionName: string;
  patientId: string;
  toothConditions: ToothConditions;
  workflowNodes: WorkflowNode[];
  scheduleSlots: ScheduleSlot[];
  selectedTreatmentOptions: SelectedTreatmentOptions;
  settings: WorkflowSettings;
  createdAt: Date;
  updatedAt: Date;
}