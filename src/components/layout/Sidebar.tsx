'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Repeat,
  Tags,
  TrendingUp,
  FileBarChart,
  Sun,
  Moon,
  LogOut,
  FileUp,
} from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
  { href: '/fixas', label: 'Despesas Fixas', icon: Repeat },
  { href: '/categorias', label: 'Categorias', icon: Tags },
  { href: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { href: '/relatorios', label: 'Relatórios', icon: FileBarChart },
  { href: '/importar', label: 'Importar Extrato', icon: FileUp },
];

interface SidebarProps {
  user?: { name: string; email: string } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const theme = useFinanceStore((s) => s.theme);
  const toggleTheme = useFinanceStore((s) => s.toggleTheme);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'hidden md:flex fixed left-0 top-0 bottom-0 z-30 flex-col py-4 transition-all duration-300 glass-card rounded-none rounded-r-2xl border-l-0 border-t-0 border-b-0',
        expanded ? 'w-[220px]' : 'w-[64px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 mb-6 h-10', expanded ? 'justify-start' : 'justify-center')}>
        <div className="w-8 h-8 flex-shrink-0">
          <Logo size={32} className="w-full h-full object-contain" />
        </div>
        {expanded && (
          <span className="font-semibold text-primary whitespace-nowrap">JARVIS</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                expanded ? 'justify-start' : 'justify-center',
                active
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-700/20 text-primary border border-blue-500/30'
                  : 'text-secondary hover:bg-white/5 hover:text-primary'
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 space-y-1 mt-auto">
        {user && (
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl border border-blue-500/15 bg-white/[0.02] mb-1',
              expanded ? 'justify-start' : 'justify-center'
            )}
            title={`${user.name} · ${user.email}`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white">
              {initials}
            </div>
            {expanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-primary truncate max-w-[140px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-tertiary truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
            )}
          </div>
        )}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-white/5 hover:text-primary transition-all',
            expanded ? 'justify-start' : 'justify-center'
          )}
          title="Alternar tema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {expanded && <span className="text-sm font-medium">Tema</span>}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-secondary hover:bg-rose-500/15 hover:text-rose-400 transition-all',
            expanded ? 'justify-start' : 'justify-center'
          )}
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
          {expanded && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
