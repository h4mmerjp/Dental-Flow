import React, { useState } from 'react';
import { Plus, Search, Filter, Clock, DollarSign, User, Calendar } from 'lucide-react';
import { useTreatmentPlans } from '../hooks/useTreatmentPlans';
import { usePatients } from '../hooks/usePatients';
import { 
  TreatmentPlan, 
  TREATMENT_STATUS_LABELS, 
  TREATMENT_PRIORITY_LABELS,
  getStatusColor,
  getPriorityColor,
  calculateTreatmentProgress
} from '../types/treatmentPlan';
import { Patient } from '../types/patient';
import { Notification, useNotification } from '../components/layout/Notification';

export const TreatmentPlansPage: React.FC = () => {
  const { treatmentPlans, loading, error } = useTreatmentPlans();
  const { patients } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const { notification, showNotification, hideNotification } = useNotification();

  const getPatientName = (patientId: string): string => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : '不明な患者';
  };

  const filteredPlans = treatmentPlans.filter(plan => {
    const matchesSearch = 
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPatientName(plan.patientId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || plan.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}時間${mins > 0 ? `${mins}分` : ''}`;
    }
    return `${mins}分`;
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const handleCreatePlan = () => {
    // 後で実装：新規治療計画作成モーダルを開く
    showNotification('info', '新規治療計画作成機能は開発中です');
  };

  const handleViewPlan = (planId: string) => {
    // 後で実装：治療計画詳細ページに遷移
    showNotification('info', '治療計画詳細ページは開発中です');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">治療計画を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">エラーが発生しました</div>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">治療計画管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            患者の治療計画を管理・追跡します
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreatePlan}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            新規治療計画
          </button>
        </div>
      </div>

      {/* フィルター・検索 */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="治療計画名・患者名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべてのステータス</option>
              {Object.entries(TREATMENT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべての優先度</option>
              {Object.entries(TREATMENT_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-1" />
            {filteredPlans.length} 件表示
          </div>
        </div>
      </div>

      {/* 治療計画一覧 */}
      <div className="mt-8">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                ? '条件に一致する治療計画がありません' 
                : '治療計画がありません'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {plan.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 mr-1" />
                        {getPatientName(plan.patientId)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                        {TREATMENT_STATUS_LABELS[plan.status]}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(plan.priority)}`}>
                        {TREATMENT_PRIORITY_LABELS[plan.priority]}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {plan.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatCurrency(plan.totalEstimatedCost)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(plan.totalEstimatedDuration)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      開始: {formatDate(plan.startDate)}
                    </div>
                    {plan.endDate && (
                      <div>
                        終了: {formatDate(plan.endDate)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleViewPlan(plan.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      詳細を見る
                    </button>
                    <div className="text-xs text-gray-500">
                      作成日: {formatDate(plan.createdAt?.toDate?.()?.toISOString().split('T')[0])}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
};