import { useState, useCallback } from 'react';
import { 
  DentalCondition, 
  TreatmentRule, 
  WorkflowNode, 
  TreatmentScheduleDay,
  ToothConditions,
  TreatmentRules,
  SelectedTreatmentOptions,
  WorkflowSettings,
  DEFAULT_WORKFLOW_SETTINGS,
  TREATMENT_PRIORITY 
} from '../types/dentalWorkflow';

export const useDentalWorkflow = () => {
  const [settings, setSettings] = useState<WorkflowSettings>(DEFAULT_WORKFLOW_SETTINGS);
  const [toothConditions, setToothConditions] = useState<ToothConditions>({});
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowNode[]>([]);
  const [treatmentSchedule, setTreatmentSchedule] = useState<TreatmentScheduleDay[]>([]);
  const [selectedTreatmentOptions, setSelectedTreatmentOptions] = useState<SelectedTreatmentOptions>({});
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false);

  const getConditionInfo = useCallback((code: string): DentalCondition | null => {
    return settings.conditions.find(c => c.code === code) || null;
  }, [settings.conditions]);

  const getToothDisplayConditions = useCallback((conditionsList: string[]): DentalCondition[] => {
    if (!conditionsList || conditionsList.length === 0) return [];
    return conditionsList.map(code => getConditionInfo(code)).filter(Boolean) as DentalCondition[];
  }, [getConditionInfo]);

  const handleToothClick = useCallback((toothNumber: string) => {
    setSelectedTooth(toothNumber);
  }, []);

  const handleConditionSelect = useCallback((conditionCode: string) => {
    if (settings.bulkConditionMode) {
      const newToothNumber = `bulk-${conditionCode}-${Date.now()}`;
      setToothConditions(prev => ({
        ...prev,
        [newToothNumber]: [conditionCode]
      }));
    } else if (selectedTooth) {
      setToothConditions(prev => {
        const currentConditions = prev[selectedTooth] || [];
        let newConditions;
        if (currentConditions.includes(conditionCode)) {
          newConditions = currentConditions.filter(c => c !== conditionCode);
        } else {
          newConditions = [...currentConditions, conditionCode];
        }
        
        if (newConditions.length === 0) {
          const newState = { ...prev };
          delete newState[selectedTooth];
          return newState;
        }
        
        return {
          ...prev,
          [selectedTooth]: newConditions
        };
      });
    }
  }, [selectedTooth, settings.bulkConditionMode]);

  const generateTreatmentNodes = useCallback(() => {
    const workflowSteps: WorkflowNode[] = [];
    
    TREATMENT_PRIORITY.forEach(condition => {
      const affectedTeeth: string[] = [];
      Object.entries(toothConditions).forEach(([tooth, conditionsList]) => {
        if (conditionsList.includes(condition)) {
          affectedTeeth.push(tooth);
        }
      });
      
      if (affectedTeeth.length > 0) {
        const treatments = settings.treatmentRules[condition] || [];
        
        if (settings.treatmentGroupingMode === 'individual') {
          affectedTeeth.forEach(tooth => {
            const treatmentKey = `${condition}-${tooth}`;
            const selectedTreatmentIndex = selectedTreatmentOptions[treatmentKey] || 0;
            const selectedTreatment = treatments[selectedTreatmentIndex] || treatments[0];
            
            if (selectedTreatment) {
              const cards = [];
              for (let i = 0; i < selectedTreatment.duration; i++) {
                const cardId = `${condition}-${selectedTreatment.name}-${tooth}-${Date.now()}-${Math.random()}-${i}`;
                const stepName = selectedTreatment.steps && selectedTreatment.steps[i] ? selectedTreatment.steps[i] : `${selectedTreatment.name}(${i + 1})`;
                cards.push({
                  id: cardId,
                  baseId: `${condition}-${selectedTreatment.name}-${tooth}`,
                  condition,
                  treatment: selectedTreatment.name,
                  stepName: stepName,
                  teeth: [tooth],
                  cardNumber: i + 1,
                  totalCards: selectedTreatment.duration,
                  position: { x: 0, y: workflowSteps.length * 120 },
                  isSequential: selectedTreatment.duration > 1,
                  treatmentKey: treatmentKey,
                  availableTreatments: treatments,
                  selectedTreatmentIndex: selectedTreatmentIndex,
                  hasMultipleTreatments: treatments.length > 1
                });
              }
              workflowSteps.push(...cards);
            }
          });
        } else {
          const treatmentKey = `${condition}-${affectedTeeth.sort().join(',')}`;
          const selectedTreatmentIndex = selectedTreatmentOptions[treatmentKey] || 0;
          const selectedTreatment = treatments[selectedTreatmentIndex] || treatments[0];
          
          if (selectedTreatment) {
            const cards = [];
            for (let i = 0; i < selectedTreatment.duration; i++) {
              const cardId = `${condition}-${selectedTreatment.name}-${Date.now()}-${Math.random()}-${i}`;
              const stepName = selectedTreatment.steps && selectedTreatment.steps[i] ? selectedTreatment.steps[i] : `${selectedTreatment.name}(${i + 1})`;
              cards.push({
                id: cardId,
                baseId: `${condition}-${selectedTreatment.name}`,
                condition,
                treatment: selectedTreatment.name,
                stepName: stepName,
                teeth: affectedTeeth,
                cardNumber: i + 1,
                totalCards: selectedTreatment.duration,
                position: { x: 0, y: workflowSteps.length * 120 },
                isSequential: selectedTreatment.duration > 1,
                treatmentKey: treatmentKey,
                availableTreatments: treatments,
                selectedTreatmentIndex: selectedTreatmentIndex,
                hasMultipleTreatments: treatments.length > 1
              });
            }
            workflowSteps.push(...cards);
          }
        }
      }
    });
    
    setWorkflow(workflowSteps);
    
    // 初期スケジュール生成
    const today = new Date();
    const initialSchedule = [];
    for (let i = 0; i < Math.max(8, Math.ceil(workflowSteps.length / 2)); i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (i * 7));
      initialSchedule.push({
        date: date.toISOString().split('T')[0],
        treatments: []
      });
    }
    setTreatmentSchedule(initialSchedule);
    
    return workflowSteps;
  }, [toothConditions, settings.treatmentRules, settings.treatmentGroupingMode, selectedTreatmentOptions]);

  const changeTreatmentOption = useCallback((treatmentKey: string, newTreatmentIndex: number) => {
    setSelectedTreatmentOptions(prev => ({
      ...prev,
      [treatmentKey]: newTreatmentIndex
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<WorkflowSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const addCondition = useCallback((condition: DentalCondition) => {
    setSettings(prev => ({
      ...prev,
      conditions: [...prev.conditions, condition]
    }));
  }, []);

  const deleteCondition = useCallback((code: string) => {
    setSettings(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.code !== code),
      treatmentRules: Object.fromEntries(
        Object.entries(prev.treatmentRules).filter(([key]) => key !== code)
      )
    }));
  }, []);

  const addTreatment = useCallback((conditionCode: string, treatment: TreatmentRule) => {
    setSettings(prev => ({
      ...prev,
      treatmentRules: {
        ...prev.treatmentRules,
        [conditionCode]: [...(prev.treatmentRules[conditionCode] || []), treatment]
      }
    }));
  }, []);

  const deleteTreatment = useCallback((conditionCode: string, treatmentIndex: number) => {
    setSettings(prev => ({
      ...prev,
      treatmentRules: {
        ...prev.treatmentRules,
        [conditionCode]: prev.treatmentRules[conditionCode]?.filter((_, index) => index !== treatmentIndex) || []
      }
    }));
  }, []);

  const moveTreatment = useCallback((conditionCode: string, fromIndex: number, toIndex: number) => {
    setSettings(prev => {
      const treatments = [...(prev.treatmentRules[conditionCode] || [])];
      const [moved] = treatments.splice(fromIndex, 1);
      treatments.splice(toIndex, 0, moved);
      
      return {
        ...prev,
        treatmentRules: {
          ...prev.treatmentRules,
          [conditionCode]: treatments
        }
      };
    });
  }, []);

  const clearToothConditions = useCallback(() => {
    setToothConditions({});
    setSelectedTooth(null);
  }, []);

  const clearWorkflow = useCallback(() => {
    setWorkflow([]);
    setTreatmentSchedule([]);
    setSelectedTreatmentOptions({});
  }, []);

  const resetAll = useCallback(() => {
    setSettings(DEFAULT_WORKFLOW_SETTINGS);
    setToothConditions({});
    setSelectedTooth(null);
    setWorkflow([]);
    setTreatmentSchedule([]);
    setSelectedTreatmentOptions({});
  }, []);

  return {
    // State
    settings,
    toothConditions,
    selectedTooth,
    workflow,
    treatmentSchedule,
    selectedTreatmentOptions,
    isGeneratingWorkflow,
    
    // Computed
    getConditionInfo,
    getToothDisplayConditions,
    
    // Actions
    handleToothClick,
    handleConditionSelect,
    generateTreatmentNodes,
    changeTreatmentOption,
    updateSettings,
    addCondition,
    deleteCondition,
    addTreatment,
    deleteTreatment,
    moveTreatment,
    clearToothConditions,
    clearWorkflow,
    resetAll,
    
    // Setters
    setToothConditions,
    setSelectedTooth,
    setWorkflow,
    setTreatmentSchedule,
    setSelectedTreatmentOptions,
    setIsGeneratingWorkflow
  };
};