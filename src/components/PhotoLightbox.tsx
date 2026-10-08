import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Meal } from '../types/meal';
import { formatDisplayDate } from '../lib/dateUtils';

interface PhotoLightboxProps {
  meal: Meal | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ meal, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (meal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [meal, onClose]);

  if (!meal || !meal.photo_url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{meal.description}</h3>
            <p className="text-xs text-slate-500">
              {formatDisplayDate(meal.date)} · {meal.type} · ${meal.amount.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close photo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo view */}
        <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-2 min-h-[280px]">
          <img
            src={meal.photo_url}
            alt={meal.description}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-md"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};
