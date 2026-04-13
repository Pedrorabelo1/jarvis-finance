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
    <header className="sticky top-0 z-20 mb-4 sm:mb-6">
      <div className="glass-card rounded-2xl px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        <h1 className="text-lg sm:text-2xl font-semibold text-primary truncate min-w-0 shrink">
          {title}
        </h1>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showPeriodSelector && (
            <div className="flex items-center gap-0.5 sm:gap-1 glass-card !p-0.5 sm:!p-1 !rounded-xl">
              <button
                onClick={goToPreviousMonth}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-secondary"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <span className="text-[11px] sm:text-sm font-medium text-primary px-1 sm:px-2 min-w-[85px] sm:min-w-[110px] text-center tabular">
                {monthLabel}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-secondary"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}

          <button
            onClick={toggleHideValues}
            className="p-1.5 sm:p-2 rounded-xl glass-card !p-1.5 sm:!p-2 text-secondary hover:text-primary"
            aria-label="Ocultar valores"
            title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {hideValues ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
