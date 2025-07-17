import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PatientFormData } from '../../types/patient';
import { isValidDate } from '../../utils/ageCalculator';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (data: PatientFormData) => Promise<void>;
  onSuccess?: (message: string) => void;
}

interface FormErrors {
  patientId?: string;
  name?: string;
  nameKana?: string;
  birthdate?: string;
  lastVisitDate?: string;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    patientId: '',
    name: '',
    nameKana: '',
    birthdate: '',
    lastVisitDate: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.patientId.trim()) {
      newErrors.patientId = '患者IDは必須です';
    }

    if (!formData.name.trim()) {
      newErrors.name = '氏名は必須です';
    }

    if (!formData.nameKana.trim()) {
      newErrors.nameKana = 'カナ氏名は必須です';
    } else if (!/^[ァ-ヶー　\s]+$/.test(formData.nameKana)) {
      newErrors.nameKana = 'カナ氏名はカタカナで入力してください';
    }

    if (!formData.birthdate.trim()) {
      newErrors.birthdate = '生年月日は必須です';
    } else if (!isValidDate(formData.birthdate)) {
      newErrors.birthdate = '正しい日付形式で入力してください (YYYY-MM-DD)';
    }

    if (formData.lastVisitDate && !isValidDate(formData.lastVisitDate)) {
      newErrors.lastVisitDate = '正しい日付形式で入力してください (YYYY-MM-DD)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPatient({
        ...formData,
        lastVisitDate: formData.lastVisitDate || null,
      });
      
      // Reset form and close modal on success
      setFormData({
        patientId: '',
        name: '',
        nameKana: '',
        birthdate: '',
        lastVisitDate: null,
      });
      setErrors({});
      onSuccess?.(`患者「${formData.name}」を追加しました`);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '患者の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'lastVisitDate' ? (value || null) : value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            新規患者を追加
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {submitError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
              患者ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="patientId"
              value={formData.patientId}
              onChange={(e) => handleInputChange('patientId', e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.patientId ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="nameKana" className="block text-sm font-medium text-gray-700">
              カナ氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nameKana"
              value={formData.nameKana}
              onChange={(e) => handleInputChange('nameKana', e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.nameKana ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
              placeholder="タナカタロウ"
            />
            {errors.nameKana && (
              <p className="mt-1 text-sm text-red-600">{errors.nameKana}</p>
            )}
          </div>

          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
              生年月日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="birthdate"
              value={formData.birthdate}
              onChange={(e) => handleInputChange('birthdate', e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.birthdate ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.birthdate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastVisitDate" className="block text-sm font-medium text-gray-700">
              最終来院日
            </label>
            <input
              type="date"
              id="lastVisitDate"
              value={formData.lastVisitDate || ''}
              onChange={(e) => handleInputChange('lastVisitDate', e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.lastVisitDate ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.lastVisitDate && (
              <p className="mt-1 text-sm text-red-600">{errors.lastVisitDate}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  追加中...
                </>
              ) : (
                '追加'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};