import React from 'react';
import { Database, UtensilsCrossed } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  onOpenDbInfo: () => void;
  isTableReady?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDbInfo, isTableReady }) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-slate-800" />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Meal Tracking
          </span>
        </div>

        {/* Zone 2: Navigation / Info */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                !isSupabaseConfigured
                  ? 'bg-slate-400'
                  : isTableReady
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-600">
              {!isSupabaseConfigured
                ? 'Local Preview Mode'
                : isTableReady
                ? 'Supabase Live'
                : 'Supabase Connected (Local Storage)'}
            </span>
          </div>
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDbInfo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Supabase Schema & Configuration"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Supabase Setup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
