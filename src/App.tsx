/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Meal, MonthOption, MealType } from './types/meal';
import {
  getBudgetMonths,
  getMealsByMonth,
  addMealRecord,
  deleteMealRecord,
  getDatabaseStatus,
} from './services/mealService';
import { getTodayDateString, formatMonthYearLabel, parseDateToYearMonthDay } from './lib/dateUtils';
import { Header } from './components/Header';
import { MealForm } from './components/MealForm';
import { MonthSelector } from './components/MonthSelector';
import { MealTable } from './components/MealTable';
import { PhotoLightbox } from './components/PhotoLightbox';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SupabaseInfoModal } from './components/SupabaseInfoModal';
import { Toast, ToastMessage } from './components/Toast';
import { Info } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  // Available budget months
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loadingMonths, setLoadingMonths] = useState<boolean>(true);

  // Meal records for selected month
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState<boolean>(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Deletion modal state
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Photo Lightbox modal state
  const [activePhotoMeal, setActivePhotoMeal] = useState<Meal | null>(null);

  // Supabase info modal state
  const [showDbInfo, setShowDbInfo] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Database readiness state
  const [isTableReady, setIsTableReady] = useState<boolean>(false);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute selected month label (e.g. "Oct-2026")
  const selectedMonthLabel = useMemo(() => {
    const opt = monthOptions.find((o) => o.value === selectedMonth);
    if (opt) return opt.label;
    if (selectedMonth) {
      const parts = selectedMonth.split('-');
      if (parts.length === 2) {
        return formatMonthYearLabel(parseInt(parts[0], 10), parseInt(parts[1], 10));
      }
    }
    return 'selected month';
  }, [monthOptions, selectedMonth]);

  // Load available months from budget table on startup
  useEffect(() => {
    let isMounted = true;
    const initMonths = async () => {
      setLoadingMonths(true);
      try {
        const options = await getBudgetMonths();
        if (!isMounted) return;
        setMonthOptions(options);

        // Find current month key: e.g. "2026-10"
        const todayStr = getTodayDateString();
        const parsedToday = parseDateToYearMonthDay(todayStr);
        const currentKey = parsedToday
          ? `${parsedToday.year}-${String(parsedToday.month).padStart(2, '0')}`
          : '2026-10';

        // Select current month by default
        const defaultMatch = options.find((o) => o.value === currentKey);
        const initialSelection = defaultMatch ? defaultMatch.value : (options[0]?.value || currentKey);
        setSelectedMonth(initialSelection);
      } catch (err) {
        console.warn('Could not load budget months, using defaults:', err);
      } finally {
        if (isMounted) setLoadingMonths(false);
      }
    };

    initMonths();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load meals whenever selectedMonth changes
  const loadMeals = useCallback(
    async (monthKey: string) => {
      if (!monthKey) return;
      setLoadingMeals(true);
      try {
        const records = await getMealsByMonth(monthKey);
        setMeals(records);
        setIsTableReady(getDatabaseStatus().isTableReady);
      } catch (err) {
        console.warn('Failed to fetch meals:', err);
      } finally {
        setLoadingMeals(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedMonth) {
      loadMeals(selectedMonth);
    }
  }, [selectedMonth, loadMeals]);

  // Handle Add Meal Record
  const handleAddMeal = async (
    data: { description: string; amount: number; type: MealType; date: string },
    photoFile: File | null
  ): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      await addMealRecord(data, photoFile);
      addToast('success', `Added meal: ${data.description} ($${data.amount.toFixed(2)})`);

      // Determine month of added meal
      const addedDateParsed = parseDateToYearMonthDay(data.date);
      const addedMonthKey = addedDateParsed
        ? `${addedDateParsed.year}-${String(addedDateParsed.month).padStart(2, '0')}`
        : selectedMonth;

      // Ensure this month exists in monthOptions if it was not in budget table
      setMonthOptions((prev) => {
        if (prev.some((o) => o.value === addedMonthKey)) return prev;
        const newOpt: MonthOption = {
          value: addedMonthKey,
          label: formatMonthYearLabel(addedDateParsed!.year, addedDateParsed!.month),
          year: addedDateParsed!.year,
          month: addedDateParsed!.month,
        };
        return [...prev, newOpt].sort((a, b) => a.value.localeCompare(b.value));
      });

      // Keep the currently selected month/year and refresh table
      await loadMeals(selectedMonth);
      return true;
    } catch (err) {
      console.warn('Error adding meal:', err);
      addToast('error', 'Failed to save meal record. Please check the form.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Record Confirmation
  const handleConfirmDelete = async () => {
    if (!mealToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMealRecord(mealToDelete);
      addToast('success', `Deleted record for ${mealToDelete.description}.`);
      setMealToDelete(null);
      // Refresh table
      await loadMeals(selectedMonth);
    } catch (err) {
      console.warn('Error deleting meal:', err);
      addToast('error', 'Failed to delete meal record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculations for current selected month
  const totalAmount = useMemo(() => {
    return meals.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }, [meals]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-900 selection:text-white pb-16">
      {/* Top Bar Header */}
      <Header
        onOpenDbInfo={() => setShowDbInfo(true)}
        isTableReady={isTableReady}
      />

      {/* Setup notification banner if Supabase is connected but tables are not created yet */}
      {isSupabaseConfigured && !isTableReady && (
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Supabase database connected. To sync directly with your PostgreSQL database, run the SQL setup script.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDbInfo(true)}
              className="font-semibold underline text-amber-900 hover:text-amber-950 whitespace-nowrap cursor-pointer"
            >
              View 1-Click SQL Script →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container: Mobile-first responsive layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* 1. Add Meal Record Form */}
        <MealForm
          onAddMeal={handleAddMeal}
          isSubmitting={isSubmitting}
        />

        {/* 2. Month Selector & Summary Bar */}
        <MonthSelector
          options={monthOptions}
          selectedMonth={selectedMonth}
          onChange={(newMonth) => setSelectedMonth(newMonth)}
          isLoading={loadingMonths || loadingMeals}
          mealCount={meals.length}
          totalAmount={totalAmount}
        />

        {/* 3. Results Display Table */}
        <MealTable
          meals={meals}
          isLoading={loadingMeals}
          selectedMonthLabel={selectedMonthLabel}
          onPhotoClick={(meal) => setActivePhotoMeal(meal)}
          onDeleteClick={(meal) => setMealToDelete(meal)}
        />
      </main>

      {/* Photo Lightbox Modal */}
      <PhotoLightbox
        meal={activePhotoMeal}
        onClose={() => setActivePhotoMeal(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        meal={mealToDelete}
        isOpen={Boolean(mealToDelete)}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMealToDelete(null)}
      />

      {/* Supabase Schema & Instructions Modal */}
      <SupabaseInfoModal
        isOpen={showDbInfo}
        onClose={() => setShowDbInfo(false)}
      />

      {/* Notification Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
