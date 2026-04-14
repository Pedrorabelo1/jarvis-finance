'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Sun, Moon, LogOut, User, X } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatMonthYear } from '@/lib/formatters';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/lancamentos': 'Lançamentos',
  '/fixas': 'Despesas Fixas',
  '/categorias': 'Categorias',
  '/investimentos': 'Investimentos',
  '/relatorios': 'Relatórios',
};

interface HeaderProps {
  user?: { name: string; email: string } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedYear, selectedMonth, goToPreviousMonth, goToNextMonth, hideValues, toggleHideValues, theme, toggleTheme } =
    useFinanceStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  const title =
    Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'JARVIS';

  const monthLabel = formatMonthYear(new Date(selectedYear, selectedMonth, 1));

  const showPeriodSelector = ['/dashboard', '/lancamentos', '/fixas'].some((p) =>
    pathname.startsWith(p)
  );

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    setSheetOpen(false);
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  return (
    <>
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

            {/* Avatar — mobile only */}
            <button
              onClick={() => setSheetOpen(true)}
              className="md:hidden w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-[11px] font-bold shadow-lg flex-shrink-0"
              aria-label="Perfil"
            >
              {initials}
            </button>
          </div>
        </div>
      </header>

      {/* Bottom sheet — mobile profile / settings */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="relative glass-card-strong !rounded-b-none !rounded-t-3xl p-6 pb-10 flex flex-col gap-4 animate-slide-up">
            {/* Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20" />

            {/* User info */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-primary truncate">{user?.name || 'Usuário'}</div>
                <div className="text-xs text-secondary truncate">{user?.email || ''}</div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Theme toggle */}
            <button
              onClick={() => { toggleTheme(); }}
              className="flex items-center gap-3 w-full p-3.5 rounded-2xl glass-card hover:border-blue-500/30 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                {theme === 'dark'
                  ? <Sun className="w-4.5 h-4.5 text-amber-400" />
                  : <Moon className="w-4.5 h-4.5 text-blue-400" />
                }
              </div>
              <div>
                <div className="text-sm font-medium text-primary">
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </div>
                <div className="text-[11px] text-secondary">
                  {theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                </div>
              </div>
              {/* Toggle pill */}
              <div className="ml-auto">
                <div className={cn(
                  'w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center',
                  theme === 'dark' ? 'bg-blue-600' : 'bg-white/20'
                )}>
                  <div className={cn(
                    'w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </div>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3.5 rounded-2xl glass-card hover:border-rose-500/30 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4.5 h-4.5 text-rose-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-rose-400">Sair da conta</div>
                <div className="text-[11px] text-secondary">Encerrar sessão</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
