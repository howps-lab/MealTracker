import React from 'react';
import { Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Meal } from '../types/meal';
import { formatDisplayDate } from '../lib/dateUtils';

interface MealTableProps {
  meals: Meal[];
  isLoading: boolean;
  selectedMonthLabel: string;
  onPhotoClick: (meal: Meal) => void;
  onDeleteClick: (meal: Meal) => void;
}

export const MealTable: React.FC<MealTableProps> = ({
  meals,
  isLoading,
  selectedMonthLabel,
  onPhotoClick,
  onDeleteClick,
}) => {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all mt-4">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          Meal Records
        </h2>
        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading meals...</span>
          </div>
        )}
      </div>

      {isLoading && meals.length === 0 ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Loading meal records...</p>
        </div>
      ) : meals.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <p className="text-base text-slate-600 font-medium">
            No meals recorded for {selectedMonthLabel}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Use the form above to add your first meal for this month.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Photo</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {meals.map((meal) => (
                <tr key={meal.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Date column: formatted as "dd MMM yyyy", e.g. "08 Oct 2026" */}
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 whitespace-nowrap">
                    {formatDisplayDate(meal.date)}
                  </td>

                  {/* Description column */}
                  <td className="py-3.5 px-4 text-slate-800">
                    <span className="font-medium">{meal.description}</span>
                  </td>

                  {/* Type column: Breakfast / Lunch / Dinner */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${
                        meal.type === 'Breakfast'
                          ? 'bg-amber-50 text-amber-700'
                          : meal.type === 'Lunch'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {meal.type}
                    </span>
                  </td>

                  {/* Amount column: formatted with 2 decimal places */}
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    ${meal.amount.toFixed(2)}
                  </td>

                  {/* Photo column */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {meal.photo_url ? (
                      <button
                        type="button"
                        onClick={() => onPhotoClick(meal)}
                        className="inline-flex items-center justify-center p-1 rounded-lg border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
                        title="View photo"
                      >
                        <div className="w-8 h-8 rounded overflow-hidden bg-slate-100 relative">
                          <img
                            src={meal.photo_url}
                            alt={meal.description}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium">-</span>
                    )}
                  </td>

                  {/* Action / Delete column */}
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onDeleteClick(meal)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors p-1.5 cursor-pointer min-h-[36px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
