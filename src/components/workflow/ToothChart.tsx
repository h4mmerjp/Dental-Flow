import React from 'react';
import { TEETH_NUMBERS } from '../../types/dentalWorkflow';
import { useDentalWorkflow } from '../../hooks/useDentalWorkflow';

interface ToothChartProps {
  toothConditions: { [key: string]: string[] };
  selectedTooth: string | null;
  onToothClick: (toothNumber: string) => void;
  getToothDisplayConditions: (conditions: string[]) => any[];
}

export const ToothChart: React.FC<ToothChartProps> = ({
  toothConditions,
  selectedTooth,
  onToothClick,
  getToothDisplayConditions
}) => {
  const renderTooth = (toothNumber: number) => {
    const toothNumberStr = toothNumber.toString();
    const toothConditionsList = toothConditions[toothNumberStr] || [];
    const conditionInfos = getToothDisplayConditions(toothConditionsList);
    const isSelected = selectedTooth === toothNumberStr;
    
    const primaryCondition = conditionInfos[0];
    
    return (
      <div
        key={toothNumber}
        className={`w-12 h-16 border-2 rounded-sm cursor-pointer flex flex-col items-center justify-between text-xs font-bold transition-all relative
          ${isSelected ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-300' : 'border-gray-300 hover:border-gray-400'}
          ${primaryCondition ? primaryCondition.color : 'bg-white hover:bg-gray-50'}
        `}
        onClick={() => onToothClick(toothNumberStr)}
        title={conditionInfos.length > 0 ? 
          `${toothNumber}: ${conditionInfos.map(c => c.name).join(', ')}` : 
          `歯番 ${toothNumber}`
        }
      >
        {/* 歯番表示 */}
        <div className="text-[9px] leading-tight mt-1">
          {toothConditionsList.includes('Br支台') ? (
            <span className="relative">
              <span className="absolute inset-0 border border-current rounded-full"></span>
              <span className="px-1">{toothNumber}</span>
            </span>
          ) : (
            toothNumber
          )}
        </div>
        
        {/* 病名表示エリア */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-1">
          {conditionInfos.length > 0 ? (
            <div className="text-center">
              {conditionInfos.slice(0, 2).map((info, index) => (
                <div key={info.code} className="text-[8px] font-black leading-tight">
                  {info.symbol}
                </div>
              ))}
              {conditionInfos.length > 2 && (
                <div className="text-[7px] text-gray-600">+{conditionInfos.length - 2}</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6">
      <div className="text-center mb-2 text-sm text-gray-600">上顎</div>
      <div className="flex justify-center gap-1 mb-4">
        {TEETH_NUMBERS[0].map(renderTooth)}
      </div>
      <div className="text-center mb-2 text-sm text-gray-600">下顎</div>
      <div className="flex justify-center gap-1">
        {TEETH_NUMBERS[1].map(renderTooth)}
      </div>
    </div>
  );
};