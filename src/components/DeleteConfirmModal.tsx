import React, { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Meal } from '../types/meal';
import { formatDisplayDate } from '../lib/dateUtils';

interface DeleteConfirmModalProps {
  meal: Meal | null;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  meal,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onCancel();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen || !meal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
    >
      <div
        className="relative max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">
              Delete Meal Record?
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Are you sure you want to delete <strong className="font-semibold text-slate-800">{meal.description}</strong> ({formatDisplayDate(meal.date)}, ${meal.amount.toFixed(2)})?
            </p>
            {meal.photo_url && (
              <p className="text-xs text-rose-600 mt-2 font-medium">
                The associated photo will also be permanently deleted from Supabase Storage.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 min-h-[44px] cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 active:bg-rose-800 transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px] cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Record</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
