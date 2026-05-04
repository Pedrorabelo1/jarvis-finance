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
  Activity,
  ChevronRight,
} from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

// ─── Nav structure ──────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  icon: React.ElementType;
  children: NavItem[];
};

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

const NAV: NavEntry[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Atividade',
    icon: Activity,
    children: [
      { href: '/lancamentos', label: 'Lançamentos',      icon: ArrowLeftRight },
      { href: '/fixas',       label: 'Despesas Fixas',   icon: Repeat         },
      { href: '/categorias',  label: 'Categorias',       icon: Tags           },
      { href: '/importar',    label: 'Importar Extrato', icon: FileUp         },
    ],
  },
  { href: '/investimentos', label: 'Investimentos', icon: TrendingUp  },
  { href: '/relatorios',    label: 'Relatórios',    icon: FileBarChart },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface SidebarProps {
  user?: { name: string; email: string } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [expanded, setExpanded] = useState(false);
  const theme     = useFinanceStore((s) => s.theme);
  const toggleTheme = useFinanceStore((s) => s.toggleTheme);

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  // Is any child of "Atividade" currently active?
  const atividadeGroup = NAV.find(e => isGroup(e) && e.label === 'Atividade') as NavGroup;
  const atividadeActive = atividadeGroup?.children.some(c => pathname.startsWith(c.href));

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
        {expanded && <span className="font-semibold text-primary whitespace-nowrap">JARVIS</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map((entry) => {
          if (!isGroup(entry)) {
            // Top-level link
            const Icon   = entry.icon;
            const active = pathname.startsWith(entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                title={entry.label}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                  expanded ? 'justify-start' : 'justify-center',
                  active
                    ? 'bg-gradient-to-r from-blue-500/20 to-blue-700/20 text-primary border border-blue-500/30'
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {expanded && <span className="text-sm font-medium whitespace-nowrap">{entry.label}</span>}
              </Link>
            );
          }

          // Group with sub-items
          const GroupIcon = entry.icon;
          return (
            <div key={entry.label}>
              {/* Group header — only visible in collapsed as icon, in expanded as label */}
              {!expanded ? (
                // Collapsed: show group icon (acts as visual anchor)
                <div
                  title={entry.label}
                  className={cn(
                    'flex items-center justify-center px-3 py-2.5 rounded-xl',
                    atividadeActive ? 'text-blue-400' : 'text-secondary'
                  )}
                >
                  <GroupIcon className="w-5 h-5 flex-shrink-0" />
                </div>
              ) : (
                // Expanded: group label row
                <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                  <GroupIcon className="w-3.5 h-3.5 text-tertiary flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-tertiary uppercase tracking-widest whitespace-nowrap">
                    {entry.label}
                  </span>
                </div>
              )}

              {/* Sub-items */}
              <div className={cn('space-y-0.5', expanded ? 'pl-2' : '')}>
                {entry.children.map((child) => {
                  const ChildIcon = child.icon;
                  const active    = pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      title={child.label}
                      className={cn(
                        'flex items-center gap-3 rounded-xl transition-all',
                        expanded ? 'px-3 py-2 justify-start' : 'px-3 py-2 justify-center',
                        active
                          ? 'bg-gradient-to-r from-blue-500/20 to-blue-700/20 text-primary border border-blue-500/30'
                          : 'text-secondary hover:bg-white/5 hover:text-primary'
                      )}
                    >
                      {expanded && (
                        <ChevronRight className="w-3 h-3 text-tertiary flex-shrink-0 -ml-1" />
                      )}
                      <ChildIcon className="w-4 h-4 flex-shrink-0" />
                      {expanded && (
                        <span className="text-sm font-medium whitespace-nowrap">{child.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Divider after group */}
              {expanded && <div className="h-px bg-white/5 mx-2 mt-2" />}
            </div>
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
                <span className="text-xs font-semibold text-primary truncate max-w-[140px]">{user.name}</span>
                <span className="text-[10px] text-tertiary truncate max-w-[140px]">{user.email}</span>
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
