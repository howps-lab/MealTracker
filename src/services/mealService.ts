import { Meal, MealType, MonthOption } from '../types/meal';
import {
  supabase,
  isSupabaseConfigured,
  MEAL_TABLE,
  BUDGET_TABLE,
  MEAL_PHOTOS_BUCKET,
} from '../lib/supabase';
import {
  parseDateToYearMonthDay,
  formatMonthYearLabel,
  getMonthDateRange,
  getTodayDateString,
} from '../lib/dateUtils';

// Local storage keys for resilient offline/preview mode
const LOCAL_STORAGE_MEALS_KEY = 'meal_tracker_local_meals';

// Default budget dates specified in prompt example if budget table is empty or offline
const INITIAL_DEMO_BUDGET_DATES = [
  '2026-02-01', // 1 Feb 2026
  '2026-03-01', // 1 Mar 2026
  '2026-03-15', // 15 Mar 2026
  '2026-05-20', // 20 May 2026
];

// Initial realistic seed meals for immediate usability
const INITIAL_DEMO_MEALS: Meal[] = [
  {
    id: 'demo-meal-1',
    description: 'Chicken Rice',
    amount: 5.50,
    type: 'Lunch',
    date: '2026-10-08',
    photo_url: null,
    created_at: new Date(2026, 9, 8, 12, 30).toISOString(),
  },
  {
    id: 'demo-meal-2',
    description: 'Coffee & Toast',
    amount: 3.20,
    type: 'Breakfast',
    date: '2026-10-07',
    photo_url: null,
    created_at: new Date(2026, 9, 7, 8, 15).toISOString(),
  },
  {
    id: 'demo-meal-3',
    description: 'Grilled Salmon Bowl',
    amount: 14.80,
    type: 'Dinner',
    date: '2026-10-05',
    photo_url: null,
    created_at: new Date(2026, 9, 5, 19, 0).toISOString(),
  },
  {
    id: 'demo-meal-4',
    description: 'Oatmeal & Fresh Berries',
    amount: 4.50,
    type: 'Breakfast',
    date: '2026-05-20',
    photo_url: null,
    created_at: new Date(2026, 4, 20, 8, 0).toISOString(),
  },
  {
    id: 'demo-meal-5',
    description: 'Pasta Primavera',
    amount: 12.00,
    type: 'Dinner',
    date: '2026-03-15',
    photo_url: null,
    created_at: new Date(2026, 2, 15, 19, 30).toISOString(),
  },
];

// Tracks whether the public.meal table is confirmed active in Supabase
let isMealTableConfirmed = false;
let isStorageBucketConfirmed = false;

export function getDatabaseStatus() {
  return {
    isConfigured: isSupabaseConfigured,
    isTableReady: isMealTableConfirmed,
    isStorageReady: isStorageBucketConfirmed,
  };
}

/**
 * Checks if a Supabase error is due to missing table or schema cache miss (e.g. PGRST205)
 */
function isSchemaCacheError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    Boolean(err.message && err.message.includes('schema cache')) ||
    Boolean(err.message && err.message.includes('not find the table'))
  );
}

/**
 * Helper to get local meals from localStorage
 */
function getLocalMeals(): Meal[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEALS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(INITIAL_DEMO_MEALS));
      return INITIAL_DEMO_MEALS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_MEALS;
  }
}

function saveLocalMeals(meals: Meal[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(meals));
  } catch (err) {
    console.warn('Failed to save to localStorage', err);
  }
}

/**
 * Fetch available months by reading the existing `budget` table in Supabase.
 * Enforces requirement:
 * 1. Read all available Date values from budget
 * 2. Extract year and month
 * 3. Remove duplicate year/month combinations
 * 4. Sort chronologically
 * 5. Format them as mmm-yyyy
 * 6. Current month MUST always exist in dropdown
 */
export async function getBudgetMonths(): Promise<MonthOption[]> {
  const currentToday = getTodayDateString();
  const currentParsed = parseDateToYearMonthDay(currentToday);
  const currentYear = currentParsed ? currentParsed.year : 2026;
  const currentMonth = currentParsed ? currentParsed.month : 10;
  const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const monthMap = new Map<string, { year: number; month: number }>();
  // Always include current month
  monthMap.set(currentKey, { year: currentYear, month: currentMonth });

  let rawDates: unknown[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      // Inspect and read from budget table
      // Checking both uppercase "Date" and lowercase "date"
      const { data, error } = await supabase
        .from(BUDGET_TABLE)
        .select('*');

      if (error) {
        // Table not created yet or inaccessible - graceful fallback to sample budget dates
        rawDates = INITIAL_DEMO_BUDGET_DATES;
      } else if (data && data.length > 0) {
        rawDates = data.map((row: Record<string, unknown>) => {
          return row.Date ?? row.date ?? row.DATE ?? row.budget_date;
        }).filter(Boolean);
      } else {
        // Budget table is empty, use sample dates
        rawDates = INITIAL_DEMO_BUDGET_DATES;
      }
    } catch {
      rawDates = INITIAL_DEMO_BUDGET_DATES;
    }
  } else {
    // Offline/preview mode
    rawDates = INITIAL_DEMO_BUDGET_DATES;
  }

  // Parse each date and extract year & month
  for (const rawDate of rawDates) {
    const parsed = parseDateToYearMonthDay(rawDate);
    if (parsed) {
      const key = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { year: parsed.year, month: parsed.month });
      }
    }
  }

  // Also include months from any existing meals
  const allMeals = getLocalMeals();
  for (const m of allMeals) {
    const parsed = parseDateToYearMonthDay(m.date);
    if (parsed) {
      const key = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, { year: parsed.year, month: parsed.month });
      }
    }
  }

  // Sort chronologically (earliest to latest)
  const sortedKeys = Array.from(monthMap.keys()).sort();

  return sortedKeys.map((key) => {
    const item = monthMap.get(key)!;
    return {
      value: key,
      label: formatMonthYearLabel(item.year, item.month),
      year: item.year,
      month: item.month,
    };
  });
}

/**
 * Fetch meals filtered by the selected month/year.
 * Must filter: date >= YYYY-MM-01 AND date < nextMonth-01
 * Must sort: 1. Date descending, 2. Created time descending
 */
export async function getMealsByMonth(yearMonthKey: string): Promise<Meal[]> {
  const { start, endExclusive } = getMonthDateRange(yearMonthKey);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from(MEAL_TABLE)
        .select('*')
        .gte('date', start)
        .lt('date', endExclusive)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        if (isSchemaCacheError(error)) {
          isMealTableConfirmed = false;
          // Graceful fallback to local meals
          const local = getLocalMeals();
          return local
            .filter((m) => m.date >= start && m.date < endExclusive)
            .sort((a, b) => {
              if (b.date !== a.date) return b.date.localeCompare(a.date);
              return (b.created_at || '').localeCompare(a.created_at || '');
            });
        }
        // Non-schema error
        const local = getLocalMeals();
        return local
          .filter((m) => m.date >= start && m.date < endExclusive)
          .sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date);
            return (b.created_at || '').localeCompare(a.created_at || '');
          });
      }

      // Successfully fetched from Supabase
      isMealTableConfirmed = true;
      return (data || []).map((row) => ({
        id: String(row.id),
        description: String(row.description || ''),
        amount: Number(row.amount || 0),
        type: row.type as MealType,
        date: String(row.date),
        photo_url: row.photo_url || null,
        created_at: row.created_at || undefined,
      }));
    } catch {
      // Network or runtime exception, use local storage
      const local = getLocalMeals();
      return local
        .filter((m) => m.date >= start && m.date < endExclusive)
        .sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date);
          return (b.created_at || '').localeCompare(a.created_at || '');
        });
    }
  }

  // Offline / Demo fallback
  const local = getLocalMeals();
  return local
    .filter((m) => m.date >= start && m.date < endExclusive)
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
}

/**
 * Uploads photo to Supabase Storage in bucket `meal-photos`.
 * Path: meal-photos/{meal-id}/{unique-filename}
 * Gracefully falls back to data URL if bucket is not yet provisioned.
 */
export async function uploadMealPhoto(mealId: string, file: File): Promise<string> {
  const getFallbackDataUrl = (): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  if (!isSupabaseConfigured || !supabase) {
    return getFallbackDataUrl();
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const filePath = `${mealId}/${timestamp}.${cleanExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from(MEAL_PHOTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      isStorageBucketConfirmed = false;
      return getFallbackDataUrl();
    }

    isStorageBucketConfirmed = true;
    const { data: publicUrlData } = supabase.storage
      .from(MEAL_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch {
    return getFallbackDataUrl();
  }
}

/**
 * Insert a new meal into Supabase or fallback store.
 */
export async function addMealRecord(
  mealData: {
    description: string;
    amount: number;
    type: MealType;
    date: string;
  },
  photoFile: File | null
): Promise<Meal> {
  const mealId = crypto.randomUUID();
  let photoUrl: string | null = null;

  if (photoFile) {
    photoUrl = await uploadMealPhoto(mealId, photoFile);
  }

  const newMeal: Meal = {
    id: mealId,
    description: mealData.description.trim(),
    amount: Number(mealData.amount.toFixed(2)),
    type: mealData.type,
    date: mealData.date, // Exact calendar date YYYY-MM-DD
    photo_url: photoUrl,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from(MEAL_TABLE)
        .insert({
          id: newMeal.id,
          description: newMeal.description,
          amount: newMeal.amount,
          type: newMeal.type,
          date: newMeal.date,
          photo_url: newMeal.photo_url,
          created_at: newMeal.created_at,
        })
        .select()
        .single();

      if (error) {
        if (isSchemaCacheError(error)) {
          isMealTableConfirmed = false;
        }
        // Save locally so the user's action always succeeds smoothly
        const local = getLocalMeals();
        saveLocalMeals([newMeal, ...local]);
        return newMeal;
      }

      if (data) {
        isMealTableConfirmed = true;
        return {
          id: String(data.id),
          description: String(data.description),
          amount: Number(data.amount),
          type: data.type as MealType,
          date: String(data.date),
          photo_url: data.photo_url || null,
          created_at: data.created_at || newMeal.created_at,
        };
      }
    } catch {
      const local = getLocalMeals();
      saveLocalMeals([newMeal, ...local]);
      return newMeal;
    }
  }

  // Local storage save
  const local = getLocalMeals();
  saveLocalMeals([newMeal, ...local]);
  return newMeal;
}

/**
 * Deletes a meal record from Supabase database and its photo from Supabase Storage
 */
export async function deleteMealRecord(meal: Meal): Promise<void> {
  // 1. Delete associated photo from storage if exists
  if (meal.photo_url && isSupabaseConfigured && supabase) {
    try {
      const marker = `/${MEAL_PHOTOS_BUCKET}/`;
      const idx = meal.photo_url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(meal.photo_url.substring(idx + marker.length));
        if (storagePath) {
          await supabase.storage
            .from(MEAL_PHOTOS_BUCKET)
            .remove([storagePath]);
        }
      }
    } catch {
      // Continue to record deletion
    }
  }

  // 2. Delete database record
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from(MEAL_TABLE)
        .delete()
        .eq('id', meal.id);

      if (error && isSchemaCacheError(error)) {
        isMealTableConfirmed = false;
      }
    } catch {
      // Continue to local storage deletion
    }
  }

  // Always sync local storage
  const local = getLocalMeals();
  const updated = local.filter((m) => m.id !== meal.id);
  saveLocalMeals(updated);
}
