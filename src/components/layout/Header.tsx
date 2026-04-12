'use client';

import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatMonthYear } from '@/lib/formatters';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/lancamentos': 'Lançamentos',
  '/fixas': 'Despesas Fixas',
  '/categorias': 'Categorias',
  '/investimentos': 'Investimentos',
  '/relatorios': 'Relatórios',
};

export function Header() {
  const pathname = usePathname();
  const { selectedYear, selectedMonth, goToPreviousMonth, goToNextMonth, hideValues, toggleHideValues } =
    useFinanceStore();

  const title =
    Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'JARVIS';

  const monthLabel = formatMonthYear(new Date(selectedYear, selectedMonth, 1));

  const showPeriodSelector = ['/dashboard', '/lancamentos', '/fixas'].some((p) =>
    pathname.startsWith(p)
  );

  return (
    <header className="sticky top-0 z-20 mb-6">
      <div className="glass-card rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-primary truncate">{title}</h1>

        <div className="flex items-center gap-2">
          {showPeriodSelector && (
            <div className="flex items-center gap-1 glass-card !p-1 !rounded-xl">
              <button
                onClick={goToPreviousMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-secondary"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs sm:text-sm font-medium text-primary px-2 min-w-[110px] text-center tabular">
                {monthLabel}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-secondary"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={toggleHideValues}
            className="p-2 rounded-xl glass-card !p-2 text-secondary hover:text-primary"
            aria-label="Ocultar valores"
            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {hideValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
