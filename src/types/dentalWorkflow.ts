export interface DentalCondition {
  code: string;
  name: string;
  symbol: string;
  color: string;
}

export interface TreatmentRule {
  name: string;
  duration: number;
  steps: string[];
}

export interface WorkflowNode {
  id: string;
  baseId: string;
  condition: string;
  treatment: string;
  stepName: string;
  teeth: string[];
  cardNumber: number;
  totalCards: number;
  position: { x: number; y: number };
  isSequential: boolean;
  treatmentKey: string;
  availableTreatments: TreatmentRule[];
  selectedTreatmentIndex: number;
  hasMultipleTreatments: boolean;
}

export interface TreatmentScheduleDay {
  date: string;
  treatments: WorkflowNode[];
}

export interface ToothConditions {
  [toothNumber: string]: string[];
}

export interface TreatmentRules {
  [conditionCode: string]: TreatmentRule[];
}

export interface SelectedTreatmentOptions {
  [treatmentKey: string]: number;
}

export interface WorkflowSettings {
  conditions: DentalCondition[];
  treatmentRules: TreatmentRules;
  treatmentGroupingMode: 'individual' | 'grouped';
  bulkConditionMode: boolean;
  autoScheduleEnabled: boolean;
  aiPrompt: string;
}

export const DEFAULT_CONDITIONS: DentalCondition[] = [
  { code: 'C1', name: 'C1（初期う蝕）', symbol: 'C1', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { code: 'C2', name: 'C2（中等度う蝕）', symbol: 'C2', color: 'bg-orange-100 border-orange-400 text-orange-800' },
  { code: 'C3', name: 'C3（深在性う蝕）', symbol: 'C3', color: 'bg-red-100 border-red-400 text-red-800' },
  { code: 'C4', name: 'C4（残根）', symbol: 'C4', color: 'bg-red-200 border-red-600 text-red-900' },
  { code: 'pul', name: 'pul（歯髄炎）', symbol: 'pul', color: 'bg-pink-100 border-pink-400 text-pink-800' },
  { code: 'per', name: 'per（根尖性歯周炎）', symbol: 'per', color: 'bg-rose-100 border-rose-400 text-rose-800' },
  { code: 'P1', name: 'P1（軽度歯周病）', symbol: 'P1', color: 'bg-purple-100 border-purple-400 text-purple-800' },
  { code: 'P2', name: 'P2（中等度歯周病）', symbol: 'P2', color: 'bg-purple-100 border-purple-600 text-purple-900' },
  { code: '欠損', name: '欠損歯', symbol: '×', color: 'bg-gray-200 border-gray-500 text-gray-800' }
];

export const DEFAULT_TREATMENT_RULES: TreatmentRules = {
  'C1': [{ name: 'フッ素塗布', duration: 1, steps: ['フッ素塗布'] }],
  'C2': [
    { name: 'レジン充填', duration: 1, steps: ['レジン充填'] },
    { name: 'インレー', duration: 2, steps: ['印象採得', 'セット'] }
  ],
  'C3': [
    { name: '抜髄', duration: 1, steps: ['抜髄'] },
    { name: '根管治療', duration: 3, steps: ['根管拡大・洗浄', '根管充填', '仮封'] },
    { name: 'クラウン', duration: 3, steps: ['支台築造', '印象採得', 'セット'] }
  ],
  'C4': [
    { name: '根管治療', duration: 3, steps: ['根管拡大・洗浄', '根管充填', '仮封'] },
    { name: '抜歯', duration: 1, steps: ['抜歯'] }
  ],
  'pul': [
    { name: '根管治療', duration: 3, steps: ['抜髄', '根管拡大・洗浄', '根管充填'] }
  ],
  'per': [
    { name: '根管治療', duration: 4, steps: ['根管拡大・洗浄', '根管洗浄', '根管充填', '仮封'] },
    { name: '抜歯', duration: 1, steps: ['抜歯'] }
  ],
  'P1': [
    { name: 'スケーリング', duration: 1, steps: ['スケーリング'] }
  ],
  'P2': [
    { name: 'SRP', duration: 2, steps: ['スケーリング', 'ルートプレーニング'] }
  ],
  '欠損': [
    { name: 'インプラント', duration: 4, steps: ['インプラント埋入', '治癒期間', '印象採得', 'セット'] },
    { name: 'ブリッジ', duration: 3, steps: ['支台歯形成', '印象採得', 'セット'] }
  ]
};

export const TEETH_NUMBERS = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
];

export const TREATMENT_PRIORITY = ['per', 'pul', 'C4', 'C3', 'P3', 'P2', 'C2', 'P1', 'C1'];

export const DEFAULT_AI_PROMPT = '患者の痛みを最優先に、急性症状から治療してください。根管治療は週1回ペース、補綴物は2週間隔で進めてください。';

export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  conditions: DEFAULT_CONDITIONS,
  treatmentRules: DEFAULT_TREATMENT_RULES,
  treatmentGroupingMode: 'individual',
  bulkConditionMode: false,
  autoScheduleEnabled: true,
  aiPrompt: DEFAULT_AI_PROMPT
};