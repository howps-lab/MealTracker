export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export interface Meal {
  id: string;
  description: string;
  amount: number;
  type: MealType;
  date: string; // YYYY-MM-DD
  photo_url?: string | null;
  created_at?: string;
}

export interface MealFormData {
  description: string;
  amount: string;
  type: MealType | '';
  date: string; // YYYY-MM-DD
  photoFile: File | null;
  photoPreview: string | null;
}

export interface FormErrors {
  description?: string;
  amount?: string;
  type?: string;
  date?: string;
  photo?: string;
}

export interface MonthOption {
  value: string; // "YYYY-MM"
  label: string; // "mmm-yyyy", e.g. "Oct-2026"
  year: number;
  month: number; // 1-12
}
