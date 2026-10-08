import React, { useState } from 'react';
import { X, Check, Copy, Database, ShieldAlert, Sparkles } from 'lucide-react';
import { isSupabaseConfigured, SUPABASE_URL } from '../lib/supabase';

interface SupabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEMA_SQL = `-- 1. Create the 'meal' table
create table if not exists public.meal (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('Breakfast', 'Lunch', 'Dinner')),
  date date not null,
  photo_url text,
  created_at timestamptz default now()
);

-- Enable Row Level Security and allow public access (No authentication required)
alter table public.meal enable row level security;

create policy "Allow public all on meal"
  on public.meal
  for all
  using (true)
  with check (true);

-- 2. Inspect / Create existing 'budget' table if not present
create table if not exists public.budget (
  id bigint generated always as identity primary key,
  "Date" date not null
);

alter table public.budget enable row level security;

create policy "Allow public read on budget"
  on public.budget
  for select
  using (true);

-- Sample budget dates (if seeding)
insert into public.budget ("Date") values 
  ('2026-02-01'),
  ('2026-03-01'),
  ('2026-03-15'),
  ('2026-05-20');

-- 3. Create 'meal-photos' Storage bucket
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do update set public = true;

create policy "Allow public read meal-photos"
  on storage.objects
  for select
  using (bucket_id = 'meal-photos');

create policy "Allow public upload meal-photos"
  on storage.objects
  for insert
  with check (bucket_id = 'meal-photos');

create policy "Allow public delete meal-photos"
  on storage.objects
  for delete
  using (bucket_id = 'meal-photos');
`;

export const SupabaseInfoModal: React.FC<SupabaseInfoModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-slate-900 text-base">
              Supabase Configuration & Schema
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <div>
              <div className="font-semibold text-slate-900">
                Connection Status:{' '}
                {isSupabaseConfigured ? (
                  <span className="text-emerald-700">Supabase Connected ({SUPABASE_URL})</span>
                ) : (
                  <span className="text-amber-700">Local / Offline Preview Mode</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isSupabaseConfigured
                  ? 'All operations are directly connected to your Supabase PostgreSQL instance and Storage bucket.'
                  : 'Currently operating seamlessly with local storage and sample budget dates. To connect to Supabase, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
                Supabase SQL Setup Script
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 text-xs rounded-xl overflow-x-auto font-mono max-h-64 leading-relaxed">
              {SCHEMA_SQL}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
