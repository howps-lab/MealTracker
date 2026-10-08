import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2, Plus, RotateCcw, Calendar } from 'lucide-react';
import { MealType, FormErrors } from '../types/meal';
import { getTodayDateString, formatDisplayDate } from '../lib/dateUtils';
import { processAndCompressImage } from '../lib/imageCompressor';

interface MealFormProps {
  onAddMeal: (
    data: { description: string; amount: number; type: MealType; date: string },
    photoFile: File | null
  ) => Promise<boolean>;
  isSubmitting: boolean;
}

export const MealForm: React.FC<MealFormProps> = ({ onAddMeal, isSubmitting }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<MealType | ''>('Lunch');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // File input refs for mobile camera and gallery picker
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPhotoProcessing(true);
      setErrors((prev) => ({ ...prev, photo: undefined }));
      const { file: compressedFile, previewUrl } = await processAndCompressImage(file);
      setPhotoFile(compressedFile);
      setPhotoPreview(previewUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to process selected image.';
      setErrors((prev) => ({ ...prev, photo: msg }));
    } finally {
      setPhotoProcessing(false);
      // Reset input value to allow re-selecting same file if needed
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrors((prev) => ({ ...prev, photo: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Description validation
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    // 2. Amount validation
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
    }

    // 3. Type validation
    if (!type || !['Breakfast', 'Lunch', 'Dinner'].includes(type)) {
      newErrors.type = 'Type must be Breakfast, Lunch, or Dinner';
    }

    // 4. Date validation
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        newErrors.date = 'Valid date is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || photoProcessing) return;

    if (!validate()) return;

    const parsedAmount = parseFloat(amount);
    const success = await onAddMeal(
      {
        description: description.trim(),
        amount: parsedAmount,
        type: type as MealType,
        date: date,
      },
      photoFile
    );

    if (success) {
      // Clear form on successful submission
      handleClearAll();
    }
  };

  /**
   * Section 4 requirement: Clear All Button
   * Clears Description, Amount, resets Type, resets Date to today,
   * removes photo & preview, clears validation messages.
   * Does NOT delete existing records from database!
   */
  const handleClearAll = () => {
    setDescription('');
    setAmount('');
    setType('Lunch');
    setDate(getTodayDateString());
    handleRemovePhoto();
    setErrors({});
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 transition-all">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Add Meal Record
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Record your daily meals with prices, meal types, and optional photos.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-rose-500">*</span>
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="e.g. Chicken Rice"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
              errors.description
                ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-slate-900'
            }`}
          />
          {errors.description && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.description}</p>
          )}
        </div>

        {/* Amount & Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount Field */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1.5">
              Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                placeholder="e.g. 5.50"
                disabled={isSubmitting}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10 tabular-nums ${
                  errors.amount
                    ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                    : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-slate-900'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.amount}</p>
            )}
          </div>

          {/* Type Field */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1.5">
              Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as MealType);
                if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
              }}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 rounded-xl border text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                errors.type
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                  : 'border-slate-300 text-slate-900 hover:border-slate-400 focus:border-slate-900'
              }`}
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
            {errors.type && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.type}</p>
            )}
          </div>
        </div>

        {/* Date Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="date" className="block text-sm font-medium text-slate-700">
              Date <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              Selected: {formatDisplayDate(date)}
            </span>
          </div>

          <div className="relative">
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 rounded-xl border text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
                errors.date
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500'
                  : 'border-slate-300 text-slate-900 hover:border-slate-400 focus:border-slate-900'
              }`}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Displays as {formatDisplayDate(date)} (dd MMM yyyy)
          </p>
          {errors.date && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.date}</p>
          )}
        </div>

        {/* Photo Upload Section */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Photo (Optional)
          </label>

          {/* Hidden HTML5 File Inputs with mobile capture and image/* */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
            disabled={isSubmitting || photoProcessing}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
            disabled={isSubmitting || photoProcessing}
          />

          {!photoPreview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isSubmitting || photoProcessing}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer min-h-[48px]"
              >
                <Camera className="w-5 h-5 text-slate-600 shrink-0" />
                <span>Take Photo (Camera)</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isSubmitting || photoProcessing}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer min-h-[48px]"
              >
                <ImageIcon className="w-5 h-5 text-slate-600 shrink-0" />
                <span>Choose Photo (Gallery)</span>
              </button>
            </div>
          ) : (
            <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                <img
                  src={photoPreview}
                  alt="Meal preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 w-full flex flex-col justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    Photo ready to upload
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {photoFile ? `${(photoFile.size / 1024).toFixed(0)} KB · ` : ''}
                    Will be stored in Supabase Storage (`meal-photos`)
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {photoProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Optimizing photo...</span>
            </div>
          )}

          {errors.photo && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{errors.photo}</p>
          )}
        </div>

        {/* Action Buttons: Add & Clear All */}
        <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[44px] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Clear All</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || photoProcessing}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm min-h-[44px] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Meal...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Meal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
