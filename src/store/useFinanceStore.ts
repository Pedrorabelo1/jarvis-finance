'use client';

import { create } from 'zustand';

interface FinanceState {
  // Período selecionado (mês/ano para filtrar dashboard)
  selectedYear: number;
  selectedMonth: number; // 0-indexed
  setPeriod: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;

  // Modo anônimo (oculta valores)
  hideValues: boolean;
  toggleHideValues: () => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const now = new Date();

export const useFinanceStore = create<FinanceState>((set) => ({
  selectedYear: now.getFullYear(),
  selectedMonth: now.getMonth(),
  setPeriod: (year, month) => set({ selectedYear: year, selectedMonth: month }),
  goToPreviousMonth: () =>
    set((s) => {
      const m = s.selectedMonth - 1;
      if (m < 0) return { selectedMonth: 11, selectedYear: s.selectedYear - 1 };
      return { selectedMonth: m };
    }),
  goToNextMonth: () =>
    set((s) => {
      const m = s.selectedMonth + 1;
      if (m > 11) return { selectedMonth: 0, selectedYear: s.selectedYear + 1 };
      return { selectedMonth: m };
    }),

  hideValues: false,
  toggleHideValues: () => set((s) => ({ hideValues: !s.hideValues })),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}));
