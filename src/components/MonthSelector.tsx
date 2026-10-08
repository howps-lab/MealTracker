import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { MonthOption } from '../types/meal';

interface MonthSelectorProps {
  options: MonthOption[];
  selectedMonth: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  mealCount: number;
  totalAmount: number;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  options,
  selectedMonth,
  onChange,
  isLoading,
  mealCount,
  totalAmount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 pb-2">
      <div className="flex items-center gap-2">
        <label htmlFor="month-select" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Month:</span>
        </label>

        <div className="relative inline-block">
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
            className="appearance-none bg-white border border-slate-300 hover:border-slate-400 focus:border-slate-900 rounded-xl px-4 py-2 pr-9 text-sm font-medium text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors cursor-pointer"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Summary figures */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>{mealCount} {mealCount === 1 ? 'record' : 'records'}</span>
        <span aria-hidden="true">·</span>
        <span>
          Total: <strong className="text-slate-800 font-semibold tabular-nums">${totalAmount.toFixed(2)}</strong>
        </span>
      </div>
    </div>
  );
};
