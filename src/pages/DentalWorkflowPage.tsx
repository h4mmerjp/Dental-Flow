import React, { useState } from 'react';
import { Play, Settings, Plus, Calendar, User } from 'lucide-react';
import { useDentalWorkflow } from '../hooks/useDentalWorkflow';
import { useTreatmentPlans } from '../hooks/useTreatmentPlans';
import { usePatients } from '../hooks/usePatients';
import { ToothChart } from '../components/workflow/ToothChart';
import { ConditionSelector } from '../components/workflow/ConditionSelector';
import { WorkflowSettings } from '../components/workflow/WorkflowSettings';
import { Notification, useNotification } from '../components/layout/Notification';

interface DentalWorkflowPageProps {
  patientId?: string;
}

export const DentalWorkflowPage: React.FC<DentalWorkflowPageProps> = ({ patientId }) => {
  const {
    settings,
    toothConditions,
    selectedTooth,
    workflow,
    treatmentSchedule,
    handleToothClick,
    handleConditionSelect,
    generateTreatmentNodes,
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
  const { createTreatmentPlan } = useTreatmentPlans();
  const { notification, showNotification, hideNotification } = useNotification();
  const [showSettings, setShowSettings] = useState(false);

  const selectedPatient = patientId ? patients.find(p => p.id === patientId) : null;

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

    showNotification('success', `治療ノード${workflowSteps.length}件を生成しました！`);
  };

  const handleSaveToTreatmentPlan = async () => {
    if (!selectedPatient) {
      showNotification('error', '患者を選択してください');
      return;
    }

    if (workflow.length === 0) {
      showNotification('error', '治療ノードを生成してください');
      return;
    }

    try {
      // 治療計画の基本情報
      const planTitle = `歯科治療計画 - ${selectedPatient.name}`;
      const planDescription = `生成された治療ノード: ${workflow.length}件`;

      // 治療計画を作成
      const planId = await createTreatmentPlan(selectedPatient.id, {
        title: planTitle,
        description: planDescription,
        priority: 'medium',
        startDate: treatmentSchedule.length > 0 ? treatmentSchedule[0].date : undefined,
        endDate: treatmentSchedule.length > 0 ? treatmentSchedule[treatmentSchedule.length - 1].date : undefined,
        notes: `AI生成された治療ワークフロー\n設定病名: ${Object.keys(toothConditions).length}件\n治療ステップ: ${workflow.length}件`
      });

      showNotification('success', `治療計画「${planTitle}」を保存しました！`);
      
      // 詳細ページに遷移（今後実装予定）
      console.log('Created treatment plan:', planId);
      
    } catch (error) {
      showNotification('error', '治療計画の保存に失敗しました');
      console.error('Error saving treatment plan:', error);
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

  const renderWorkflowPreview = () => {
    if (workflow.length === 0) return null;

    return (
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">治療ワークフロー</h2>
        <div className="space-y-4">
          {workflow.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{step.stepName}</div>
                <div className="text-xs text-gray-600">
                  {step.treatment} | 歯: {step.teeth.join(', ')} | 病名: {step.condition}
                </div>
              </div>
              {step.isSequential && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {step.cardNumber}/{step.totalCards}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">歯科治療ワークフロー</h1>
            {selectedPatient && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>患者: {selectedPatient.name}</span>
              </div>
            )}
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
                onClick={handleSaveToTreatmentPlan}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                治療計画に保存
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