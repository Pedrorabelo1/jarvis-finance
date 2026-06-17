'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, EyeOff, LogOut } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatMonthYear } from '@/lib/formatters';
import { useState, useEffect } from 'react';

const TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/lancamentos':  'Lançamentos',
  '/fixas':        'Despesas Fixas',
  '/categorias':   'Categorias',
  '/investimentos':'Investimentos',
  '/relatorios':   'Relatórios',
  '/importar':     'Importar Extrato',
};

interface HeaderProps {
  user?: { name: string; email: string } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { selectedYear, selectedMonth, goToPreviousMonth, goToNextMonth, hideValues, toggleHideValues } =
    useFinanceStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'JARVIS';
  const monthLabel = formatMonthYear(new Date(selectedYear, selectedMonth, 1));
  const showPeriodSelector = ['/dashboard', '/lancamentos', '/fixas'].some(p => pathname.startsWith(p));

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    setSheetOpen(false);
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  return (
    <>
      <header className="sticky top-0 z-20 mb-4 sm:mb-6 bg-[#F8FAFC] border-b border-slate-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900">
            {title}
          </h1>

          <div className="flex items-center gap-2">
            {/* Month selector */}
            {showPeriodSelector && (
              <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg px-1 py-0.5">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-medium text-slate-700 px-1.5 min-w-[90px] text-center tabular">
                  {monthLabel}
                </span>
                <button
                  onClick={goToNextMonth}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hide values */}
            <button
              onClick={toggleHideValues}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            >
              {hideValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Avatar — mobile only */}
            <button
              onClick={() => setSheetOpen(true)}
              className="md:hidden w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold"
            >
              {initials}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-white rounded-t-2xl p-6 pb-10 flex flex-col gap-3 animate-slide-up border-t border-slate-200">
            <div className="w-8 h-1 rounded-full bg-slate-200 mx-auto mb-2" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{user?.name || 'Usuário'}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </>
  );
}
