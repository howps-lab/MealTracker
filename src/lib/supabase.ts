import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_URL = (envUrl && envUrl.trim() !== '') ? envUrl.trim() : '';
export const SUPABASE_ANON_KEY = (envAnonKey && envAnonKey.trim() !== '') ? envAnonKey.trim() : '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_URL.startsWith('http') &&
  SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY.length > 10
);

// Initialize client only when valid credentials are present
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export const MEAL_TABLE = 'meal';
export const BUDGET_TABLE = 'budget';
export const MEAL_PHOTOS_BUCKET = 'meal-photos';
