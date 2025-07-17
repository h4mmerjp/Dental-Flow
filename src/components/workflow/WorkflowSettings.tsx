import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DentalCondition, TreatmentRule, WorkflowSettings as WorkflowSettingsType } from '../../types/dentalWorkflow';

interface WorkflowSettingsProps {
  settings: WorkflowSettingsType;
  onSettingsChange: (settings: Partial<WorkflowSettingsType>) => void;
  onAddCondition: (condition: DentalCondition) => void;
  onDeleteCondition: (code: string) => void;
  onAddTreatment: (conditionCode: string, treatment: TreatmentRule) => void;
  onDeleteTreatment: (conditionCode: string, treatmentIndex: number) => void;
  onMoveTreatment: (conditionCode: string, fromIndex: number, toIndex: number) => void;
  onClose: () => void;
}

export const WorkflowSettings: React.FC<WorkflowSettingsProps> = ({
  settings,
  onSettingsChange,
  onAddCondition,
  onDeleteCondition,
  onAddTreatment,
  onDeleteTreatment,
  onMoveTreatment,
  onClose
}) => {
  const [newCondition, setNewCondition] = useState<DentalCondition>({
    code: '',
    name: '',
    symbol: '',
    color: 'bg-gray-100 border-gray-400 text-gray-800'
  });

  const [newTreatment, setNewTreatment] = useState<{
    conditionCode: string;
    name: string;
    steps: string[];
  }>({
    conditionCode: '',
    name: '',
    steps: ['']
  });

  const addCondition = () => {
    if (newCondition.code && newCondition.name && newCondition.symbol) {
      onAddCondition(newCondition);
      setNewCondition({ code: '', name: '', symbol: '', color: 'bg-gray-100 border-gray-400 text-gray-800' });
    }
  };

  const addTreatment = () => {
    if (newTreatment.conditionCode && newTreatment.name && newTreatment.steps.some(step => step.trim())) {
      const filteredSteps = newTreatment.steps.filter(step => step.trim());
      onAddTreatment(newTreatment.conditionCode, {
        name: newTreatment.name,
        duration: filteredSteps.length,
        steps: filteredSteps
      });
      setNewTreatment({ conditionCode: '', name: '', steps: [''] });
    }
  };

  const addStep = () => {
    setNewTreatment(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const removeStep = (index: number) => {
    setNewTreatment(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, value: string) => {
    setNewTreatment(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? value : step)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ワークフロー設定</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AI設定 */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
            🤖 AI治療スケジューリング
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-purple-800 mb-2">
                治療方針・制約プロンプト
              </label>
              <textarea
                value={settings.aiPrompt}
                onChange={(e) => onSettingsChange({ aiPrompt: e.target.value })}
                placeholder="例：患者の痛みを最優先に、急性症状から治療してください。根管治療は週1回ペース、補綴物は2週間隔で進めてください。"
                className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* 一般設定 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-3">一般設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                治療ノードのグループ化
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="groupingMode"
                    value="individual"
                    checked={settings.treatmentGroupingMode === 'individual'}
                    onChange={(e) => onSettingsChange({ treatmentGroupingMode: e.target.value as 'individual' | 'grouped' })}
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
                    onChange={(e) => onSettingsChange({ treatmentGroupingMode: e.target.value as 'individual' | 'grouped' })}
                    className="mr-2"
                  />
                  <span className="text-sm">まとめノード（同じ治療をまとめる）</span>
                </label>
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoScheduleEnabled}
                  onChange={(e) => onSettingsChange({ autoScheduleEnabled: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">自動スケジューリング</span>
              </label>
              <p className="text-xs text-gray-600 mt-1">
                複数ステップ治療の1回目配置時に残りを自動配置
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 病名設定 */}
          <div>
            <h3 className="text-lg font-bold mb-3">病名マスター</h3>
            
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h4 className="font-medium mb-2">新しい病名を追加</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="病名コード（例：C1）"
                  value={newCondition.code}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="病名（例：C1（初期う蝕））"
                  value={newCondition.name}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="表示記号（例：C1）"
                  value={newCondition.symbol}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <select
                  value={newCondition.color}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="bg-yellow-100 border-yellow-400 text-yellow-800">黄色</option>
                  <option value="bg-orange-100 border-orange-400 text-orange-800">オレンジ</option>
                  <option value="bg-red-100 border-red-400 text-red-800">赤</option>
                  <option value="bg-pink-100 border-pink-400 text-pink-800">ピンク</option>
                  <option value="bg-purple-100 border-purple-400 text-purple-800">紫</option>
                  <option value="bg-blue-100 border-blue-400 text-blue-800">青</option>
                  <option value="bg-green-100 border-green-400 text-green-800">緑</option>
                  <option value="bg-gray-100 border-gray-400 text-gray-800">グレー</option>
                </select>
                <button
                  onClick={addCondition}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  病名を追加
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {settings.conditions.map(condition => (
                <div key={condition.code} className={`p-3 rounded border flex justify-between items-center ${condition.color}`}>
                  <div>
                    <div className="font-medium text-sm">{condition.name}</div>
                    <div className="text-xs text-gray-600">コード: {condition.code} | 記号: {condition.symbol}</div>
                  </div>
                  <button
                    onClick={() => onDeleteCondition(condition.code)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 治療法設定 */}
          <div>
            <h3 className="text-lg font-bold mb-3">治療法マスター</h3>
            
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h4 className="font-medium mb-2">新しい治療法を追加</h4>
              <div className="space-y-2">
                <select
                  value={newTreatment.conditionCode}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, conditionCode: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">対象病名を選択</option>
                  {settings.conditions.map(condition => (
                    <option key={condition.code} value={condition.code}>
                      {condition.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="治療名（例：レジン充填）"
                  value={newTreatment.name}
                  onChange={(e) => setNewTreatment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">治療ステップ</label>
                    <button
                      onClick={addStep}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      + ステップ追加
                    </button>
                  </div>
                  {newTreatment.steps.map((step, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder={`ステップ ${index + 1}`}
                        value={step}
                        onChange={(e) => updateStep(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded text-sm"
                      />
                      {newTreatment.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(index)}
                          className="text-red-500 hover:text-red-700 text-sm px-2"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addTreatment}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  治療法を追加
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.entries(settings.treatmentRules).map(([conditionCode, treatments]) => (
                <div key={conditionCode} className="border rounded-lg p-3">
                  <h4 className="font-bold text-sm mb-2">
                    {settings.conditions.find(c => c.code === conditionCode)?.name || conditionCode}
                  </h4>
                  <div className="space-y-2">
                    {treatments.map((treatment, index) => (
                      <div key={index} className={`bg-white p-2 rounded border flex justify-between items-center ${
                        index === 0 ? 'border-green-400 bg-green-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-col">
                            <button
                              onClick={() => index > 0 && onMoveTreatment(conditionCode, index, index - 1)}
                              disabled={index === 0}
                              className={`text-xs px-1 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => index < treatments.length - 1 && onMoveTreatment(conditionCode, index, index + 1)}
                              disabled={index === treatments.length - 1}
                              className={`text-xs px-1 ${index === treatments.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                            >
                              ↓
                            </button>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{treatment.name}</div>
                            <div className="text-xs text-gray-600">
                              {treatment.steps.join(' → ')} ({treatment.duration}回)
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteTreatment(conditionCode, index)}
                          className="text-red-500 hover:text-red-700 text-xs ml-2 px-2 py-1"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};