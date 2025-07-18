import React, { useState, useEffect } from 'react';
import { Play, Settings, Plus, Calendar, User, ArrowLeft, Clock, X } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDentalWorkflow } from '../hooks/useDentalWorkflow';
import { usePatientWorkflows } from '../hooks/usePatientWorkflows';
import { usePatients } from '../hooks/usePatients';
import { ToothChart } from '../components/workflow/ToothChart';
import { ConditionSelector } from '../components/workflow/ConditionSelector';
import { WorkflowSettings } from '../components/workflow/WorkflowSettings';
import { Notification, useNotification } from '../components/layout/Notification';

interface DentalWorkflowPageProps {
  patientId?: string | null;
  workflowId?: string | null;
  onBackToPatients?: () => void;
}

export const DentalWorkflowPage: React.FC<DentalWorkflowPageProps> = ({ 
  patientId, 
  workflowId,
  onBackToPatients 
}) => {
  const {
    settings,
    toothConditions,
    selectedTooth,
    workflow,
    treatmentSchedule,
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
    getToothDisplayConditions,
    setSelectedTooth,
    setToothConditions
  } = useDentalWorkflow();

  const { patients } = usePatients();
  const { createWorkflow, updateWorkflowNodes, updateWorkflow, getWorkflowById } = usePatientWorkflows();
  const { notification, showNotification, hideNotification } = useNotification();
  const [showSettings, setShowSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWorkflowData, setCurrentWorkflowData] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([]);

  const selectedPatient = patientId ? patients.find(p => p.id === patientId) : null;

  // 編集モードの場合、既存のワークフローデータを読み込む
  useEffect(() => {
    if (workflowId) {
      const existingWorkflow = getWorkflowById(workflowId);
      if (existingWorkflow) {
        setIsEditMode(true);
        setCurrentWorkflowData(existingWorkflow);
        setToothConditions(existingWorkflow.toothConditions);
        updateSettings(existingWorkflow.settings);
      }
    }
  }, [workflowId, getWorkflowById, setToothConditions, updateSettings]);

  // 患者が選択されていない場合
  if (!patientId || !selectedPatient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">患者を選択してください</h2>
          <p className="text-gray-600 mb-6">
            ワークフローを作成するには、まず患者一覧から患者を選択してください。
          </p>
          {onBackToPatients && (
            <button
              onClick={onBackToPatients}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              患者一覧に戻る
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleClearTooth = () => {
    if (selectedTooth) {
      const newConditions = { ...toothConditions };
      delete newConditions[selectedTooth];
      setToothConditions(newConditions);
    }
  };

  const handleCloseConditionSelector = () => {
    setSelectedTooth(null);
    updateSettings({ bulkConditionMode: false });
  };

  const handleGenerateWorkflow = () => {
    const workflowSteps = generateTreatmentNodes();
    
    if (workflowSteps.length === 0) {
      showNotification('warning', '歯式入力が必要です。歯をクリックして病名を設定してください。');
      return;
    }

    // スケジュールスロットを生成（最大15回分）
    const maxSlots = 15;
    const newScheduleSlots = Array.from({ length: maxSlots }, (_, index) => ({
      id: `slot-${index + 1}`,
      slotNumber: index + 1,
      treatmentNodes: []
    }));
    
    setScheduleSlots(newScheduleSlots);
    showNotification('success', `治療ノード${workflowSteps.length}件を生成しました！`);
  };

  const handleSaveToWorkflow = async () => {
    if (!selectedPatient) {
      showNotification('error', '患者を選択してください');
      return;
    }

    if (workflow.length === 0) {
      showNotification('error', '治療ノードを生成してください');
      return;
    }

    try {
      console.log('Saving workflow - Debug info:', {
        patientId: selectedPatient.id,
        workflowLength: workflow.length,
        toothConditionsCount: Object.keys(toothConditions).length,
        isEditMode
      });

      if (isEditMode && currentWorkflowData) {
        // 編集モードの場合、既存のワークフローを更新
        await updateWorkflow(currentWorkflowData.id, {
          workflowTitle: currentWorkflowData.workflowTitle,
          description: currentWorkflowData.description,
          toothConditions,
          settings
        });

        // ワークフローノードも更新
        if (workflow.length > 0) {
          await updateWorkflowNodes(currentWorkflowData.id, workflow);
        }

        showNotification('success', `ワークフロー「${currentWorkflowData.workflowTitle}」を更新しました！`);
      } else {
        // 新規作成モードの場合
        const workflowTitle = `歯科ワークフロー - ${selectedPatient.name}`;
        const workflowDescription = `生成された治療ノード: ${workflow.length}件`;

        // ワークフローを作成
        const newWorkflowId = await createWorkflow(selectedPatient.id, {
          workflowTitle,
          description: workflowDescription,
          toothConditions,
          settings
        });

        // 作成されたワークフローにノードを保存
        if (workflow.length > 0) {
          await updateWorkflowNodes(newWorkflowId, workflow);
        }

        showNotification('success', `ワークフロー「${workflowTitle}」を保存しました！`);
      }
      
      // 保存成功後、少し待ってから患者一覧に戻る
      setTimeout(() => {
        if (onBackToPatients) {
          onBackToPatients();
        }
      }, 2000);
      
    } catch (error) {
      showNotification('error', 'ワークフローの保存に失敗しました');
      console.error('Error saving workflow:', error);
    }
  };

  const renderConditionsList = () => {
    if (Object.keys(toothConditions).length === 0) return null;

    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">設定済み病名</h3>
        <div className="space-y-2">
          {Object.entries(toothConditions).map(([tooth, conditionsList]) => {
            const conditionInfos = getToothDisplayConditions(conditionsList);
            const isBulkEntry = tooth.startsWith('bulk-');
            const displayTooth = isBulkEntry ? '全般' : `歯番 ${tooth}`;
            
            return (
              <div key={tooth} className={`p-3 rounded border ${isBulkEntry ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium">
                    {displayTooth}
                    {isBulkEntry && (
                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                        歯番号なし
                      </span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    {!isBulkEntry && (
                      <button
                        onClick={() => handleToothClick(tooth)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        編集
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const newConditions = { ...toothConditions };
                        delete newConditions[tooth];
                        setToothConditions(newConditions);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {conditionInfos.map((info, index) => (
                    <span
                      key={info.code}
                      className={`text-xs px-2 py-1 rounded-full ${info.color}`}
                    >
                      {info.symbol} {info.name.split('（')[0]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleTreatmentChange = (step: any, newTreatmentIndex: number) => {
    changeTreatmentOption(step.treatmentKey, newTreatmentIndex);
    generateTreatmentNodes();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeNodeId = active.id as string;
      const overSlotId = over.id as string;
      
      // スロットにドロップされた場合
      if (overSlotId.startsWith('slot-')) {
        const slotIndex = parseInt(overSlotId.split('-')[1]) - 1;
        const activeNode = workflow.find(node => node.id === activeNodeId);
        
        if (activeNode) {
          // 複数回治療の場合、順序制約をチェック
          if (activeNode.isSequential) {
            const sameBaseNodes = workflow.filter(node => 
              node.baseId === activeNode.baseId && node.id !== activeNode.id
            );
            
            // 同じベースIDのノードがすでにスケジュールされている場合、順序をチェック
            let canSchedule = true;
            let minRequiredSlot = slotIndex;
            
            scheduleSlots.forEach((slot, index) => {
              slot.treatmentNodes.forEach((node: any) => {
                if (node.baseId === activeNode.baseId && node.cardNumber < activeNode.cardNumber) {
                  minRequiredSlot = Math.max(minRequiredSlot, index + 1);
                }
                if (node.baseId === activeNode.baseId && node.cardNumber > activeNode.cardNumber) {
                  if (index <= slotIndex) {
                    canSchedule = false;
                  }
                }
              });
            });
            
            if (!canSchedule) {
              showNotification('warning', '後の治療は前の治療より後のスケジュールに配置してください');
              setActiveId(null);
              return;
            }
            
            if (minRequiredSlot > slotIndex) {
              showNotification('warning', `この治療は第${minRequiredSlot + 1}回以降に配置してください`);
              setActiveId(null);
              return;
            }
          }
          
          setScheduleSlots(prev => {
            const newSlots = [...prev];
            
            // 既存のスロットからノードを削除
            newSlots.forEach(slot => {
              slot.treatmentNodes = slot.treatmentNodes.filter((node: any) => node.id !== activeNodeId);
            });
            
            // 新しいスロットにノードを追加
            if (newSlots[slotIndex]) {
              newSlots[slotIndex].treatmentNodes.push(activeNode);
            }
            
            return newSlots;
          });
        }
      }
      // 未予定エリアにドロップされた場合
      else if (overSlotId === 'unscheduled') {
        setScheduleSlots(prev => {
          const newSlots = [...prev];
          
          // 既存のスロットからノードを削除
          newSlots.forEach(slot => {
            slot.treatmentNodes = slot.treatmentNodes.filter((node: any) => node.id !== activeNodeId);
          });
          
          return newSlots;
        });
      }
    }
    
    setActiveId(null);
  };

  // スケジュールされていないノードを取得（グループ化）
  const getUnscheduledNodes = () => {
    const scheduledNodeIds = new Set();
    scheduleSlots.forEach(slot => {
      slot.treatmentNodes.forEach((node: any) => {
        scheduledNodeIds.add(node.id);
      });
    });
    
    const unscheduledNodes = workflow.filter(node => !scheduledNodeIds.has(node.id));
    
    // 複数回治療をグループ化
    const groups = new Map();
    unscheduledNodes.forEach(node => {
      if (node.isSequential) {
        if (!groups.has(node.baseId)) {
          groups.set(node.baseId, []);
        }
        groups.get(node.baseId).push(node);
      } else {
        groups.set(node.id, [node]);
      }
    });
    
    return Array.from(groups.values());
  };

  // 未予定エリアに戻すボタンのハンドラー
  const handleReturnToUnscheduled = (nodeId: string) => {
    setScheduleSlots(prev => {
      const newSlots = [...prev];
      
      // 該当のノードをすべてのスロットから削除
      newSlots.forEach(slot => {
        slot.treatmentNodes = slot.treatmentNodes.filter((node: any) => node.id !== nodeId);
      });
      
      return newSlots;
    });
  };

  // ドラッグ可能な治療ノードコンポーネント
  const DraggableTreatmentNode = ({ step, index, isInSchedule = false }: { step: any; index: number; isInSchedule?: boolean }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: step.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const dragHandleListeners = listeners;
    
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 bg-gray-50 rounded-lg transition-colors min-h-[120px] w-full relative ${
          isDragging ? 'shadow-lg' : ''
        } ${isInSchedule ? 'bg-white border' : ''}`}
      >
        {/* スケジュール内のノードに戻すボタンを表示 */}
        {isInSchedule && (
          <button
            onClick={() => handleReturnToUnscheduled(step.id)}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
            title="未予定に戻す"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        
        <div 
          {...attributes}
          {...dragHandleListeners}
          className="cursor-move flex items-center gap-2 mb-2"
        >
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{step.stepName}</div>
            <div className="text-xs text-gray-600 truncate">
              歯: {step.teeth.join(', ')} | {step.condition}
            </div>
          </div>
          {step.isSequential && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
              {step.cardNumber}/{step.totalCards}
            </span>
          )}
        </div>
        
        {/* 治療選択ドロップダウン */}
        {step.hasMultipleTreatments && step.availableTreatments.length > 1 && !isInSchedule && (
          <div className="mt-2">
            <select
              value={step.selectedTreatmentIndex}
              onChange={(e) => {
                handleTreatmentChange(step, parseInt(e.target.value));
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white w-full cursor-pointer"
            >
              {step.availableTreatments.map((treatment: any, treatmentIndex: number) => (
                <option key={treatmentIndex} value={treatmentIndex}>
                  {treatment.name} ({treatment.duration}回)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  // カード風の複数回治療ノードグループコンポーネント
  const TreatmentNodeGroup = ({ nodeGroup, groupIndex }: { nodeGroup: any[]; groupIndex: number }) => {
    if (nodeGroup.length === 1) {
      return <DraggableTreatmentNode step={nodeGroup[0]} index={groupIndex} />;
    }

    // 複数回治療の場合、重ねて表示
    return (
      <div className="relative w-full">
        {nodeGroup.map((node, index) => (
          <div
            key={node.id}
            className={`absolute transition-all duration-200 hover:z-10 w-full ${
              index === 0 ? 'z-10' : ''
            }`}
            style={{
              top: `${index * 8}px`,
              left: `${index * 8}px`,
              zIndex: nodeGroup.length - index,
              width: `calc(100% - ${index * 8}px)`,
            }}
          >
            <DraggableTreatmentNode step={node} index={groupIndex} />
          </div>
        ))}
        {/* スペーサー */}
        <div style={{ height: `${120 + (nodeGroup.length - 1) * 8}px` }} />
      </div>
    );
  };

  // ドロップ可能なスケジュールスロットコンポーネント
  const DropZone = ({ slot }: { slot: any }) => {
    const {
      setNodeRef,
      isOver,
    } = useSortable({ id: slot.id });

    return (
      <div
        ref={setNodeRef}
        className={`min-h-16 p-3 border-2 border-dashed rounded-lg transition-colors ${
          isOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="text-center mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          <span className="text-sm font-medium">第{slot.slotNumber}回</span>
        </div>
        <div className="space-y-2">
          {slot.treatmentNodes.map((node: any, index: number) => (
            <DraggableTreatmentNode key={node.id} step={node} index={index} isInSchedule={true} />
          ))}
          {slot.treatmentNodes.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">
              治療ノードをドラッグしてください
            </div>
          )}
        </div>
      </div>
    );
  };

  // 未予定治療エリアコンポーネント
  const UnscheduledArea = () => {
    const {
      setNodeRef,
      isOver,
    } = useSortable({ id: 'unscheduled' });

    const unscheduledNodeGroups = getUnscheduledNodes();

    return (
      <div
        ref={setNodeRef}
        className={`min-h-16 p-3 border-2 border-dashed rounded-lg transition-colors mb-6 ${
          isOver 
            ? 'border-orange-400 bg-orange-50' 
            : 'border-orange-300 bg-orange-50'
        }`}
      >
        <div className="text-center mb-3">
          <Calendar className="w-4 h-4 inline mr-1" />
          <span className="text-sm font-medium">未予定治療</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unscheduledNodeGroups.map((nodeGroup, index) => (
            <TreatmentNodeGroup key={nodeGroup[0].id} nodeGroup={nodeGroup} groupIndex={index} />
          ))}
          {unscheduledNodeGroups.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2 col-span-full">
              すべての治療がスケジュールされています
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWorkflowPreview = () => {
    if (workflow.length === 0) return null;

    const allItems = [
      'unscheduled',
      ...workflow.map(step => step.id),
      ...scheduleSlots.map(slot => slot.id)
    ];

    return (
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">治療ワークフロー</h2>
          
          <SortableContext items={allItems} strategy={verticalListSortingStrategy}>
            {/* 未予定治療エリア */}
            {scheduleSlots.length > 0 && (
              <UnscheduledArea />
            )}

            {/* スケジュールグリッド */}
            {scheduleSlots.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">治療スケジュール</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scheduleSlots.map((slot) => (
                    <DropZone key={slot.id} slot={slot} />
                  ))}
                </div>
              </div>
            )}

            {/* 治療ノード一覧（スケジュールが生成されていない場合のみ表示） */}
            {scheduleSlots.length === 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">治療ノード</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getUnscheduledNodes().map((nodeGroup, index) => (
                    <TreatmentNodeGroup key={nodeGroup[0].id} nodeGroup={nodeGroup} groupIndex={index} />
                  ))}
                </div>
              </div>
            )}
          </SortableContext>
        </div>

        {/* ドラッグオーバーレイ */}
        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-white rounded-lg shadow-lg border">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
                  •
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {workflow.find(step => step.id === activeId)?.stepName}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            {onBackToPatients && (
              <button
                onClick={onBackToPatients}
                className="inline-flex items-center mb-3 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                患者一覧に戻る
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedPatient.name}さんのワークフロー{isEditMode ? '編集' : '作成'}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>患者ID: {selectedPatient.patientId}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
              設定
            </button>
            <button
              onClick={handleGenerateWorkflow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Play className="w-4 h-4" />
              治療ノード生成
            </button>
            {workflow.length > 0 && selectedPatient && (
              <button
                onClick={handleSaveToWorkflow}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                ワークフローに{isEditMode ? '更新' : '保存'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 歯式入力 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">歯式入力</h2>
        
        {/* 設定パネル */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-blue-900">治療ノード設定</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                複数歯の同じ病名
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="groupingMode"
                    value="individual"
                    checked={settings.treatmentGroupingMode === 'individual'}
                    onChange={(e) => updateSettings({ treatmentGroupingMode: e.target.value as 'individual' | 'grouped' })}
                    className="mr-2"
                  />
                  <span className="text-sm">個別ノード（歯ごとに分離）</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="groupingMode"
                    value="grouped"
                    checked={settings.treatmentGroupingMode === 'grouped'}
                    onChange={(e) => updateSettings({ treatmentGroupingMode: e.target.value as 'individual' | 'grouped' })}
                    className="mr-2"
                  />
                  <span className="text-sm">まとめノード（同じ治療をまとめる）</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                病名設定モード
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.bulkConditionMode}
                    onChange={(e) => updateSettings({ bulkConditionMode: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">歯を選択せずに病名追加</span>
                </label>
                {settings.bulkConditionMode && (
                  <div className="text-xs text-blue-600 pl-6">
                    病名ボタンをクリックすると歯番号なしで追加されます
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 歯式図 */}
        <ToothChart
          toothConditions={toothConditions}
          selectedTooth={selectedTooth}
          onToothClick={handleToothClick}
          getToothDisplayConditions={getToothDisplayConditions}
        />

        {/* 病名選択 */}
        <ConditionSelector
          conditions={settings.conditions}
          selectedTooth={selectedTooth}
          bulkConditionMode={settings.bulkConditionMode}
          toothConditions={toothConditions}
          onConditionSelect={handleConditionSelect}
          onClose={handleCloseConditionSelector}
          onClearTooth={handleClearTooth}
        />

        {/* 設定済み病名一覧 */}
        {renderConditionsList()}
      </div>

      {/* 治療ワークフロープレビュー */}
      {renderWorkflowPreview()}

      {/* 設定モーダル */}
      {showSettings && (
        <WorkflowSettings
          settings={settings}
          onSettingsChange={updateSettings}
          onAddCondition={addCondition}
          onDeleteCondition={deleteCondition}
          onAddTreatment={addTreatment}
          onDeleteTreatment={deleteTreatment}
          onMoveTreatment={moveTreatment}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 通知 */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
};