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
  ChevronDown,
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

type NavSection = {
  section: string;        // section label (uppercase)
  items: NavEntry[];
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

const NAV_TOP: NavEntry[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
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
  const theme     = useFinanceStore((s) => s.theme);
  const toggleTheme = useFinanceStore((s) => s.toggleTheme);

  // Track which groups are open by label
  const atividadeHrefs = ['/lancamentos', '/fixas', '/categorias', '/importar'];
  const atividadeActive = atividadeHrefs.some((h) => pathname.startsWith(h));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Atividade: atividadeActive,
  });

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  function renderEntry(entry: NavEntry) {
    if (!isGroup(entry)) {
      const Icon   = entry.icon;
      const active = pathname.startsWith(entry.href);
      return (
        <Link
          key={entry.href}
          href={entry.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
            active
              ? 'bg-white/10 text-primary'
              : 'text-secondary hover:bg-white/5 hover:text-primary'
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{entry.label}</span>
          {active && <span className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
        </Link>
      );
    }

    // Group
    const GroupIcon = entry.icon;
    const isOpen    = !!openGroups[entry.label];
    const groupActive = entry.children.some((c) => pathname.startsWith(c.href));

    return (
      <div key={entry.label}>
        <button
          onClick={() => toggleGroup(entry.label)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
            groupActive ? 'text-primary' : 'text-secondary hover:bg-white/5 hover:text-primary'
          )}
        >
          <GroupIcon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium flex-1 text-left">{entry.label}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 flex-shrink-0 transition-transform duration-200',
              isOpen ? 'rotate-180' : 'rotate-0'
            )}
          />
        </button>

        {/* Sub-items */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="ml-3 pl-3 border-l border-white/10 mt-0.5 space-y-0.5">
            {entry.children.map((child) => {
              const ChildIcon = child.icon;
              const active    = pathname.startsWith(child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl transition-all',
                    active
                      ? 'bg-white/10 text-primary'
                      : 'text-secondary hover:bg-white/5 hover:text-primary'
                  )}
                >
                  <ChildIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{child.label}</span>
                  {active && <span className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[220px] flex-col py-4 glass-card rounded-none rounded-r-2xl border-l-0 border-t-0 border-b-0">

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 mb-6 h-10">
        <div className="w-8 h-8 flex-shrink-0">
          <Logo size={32} className="w-full h-full object-contain" />
        </div>
        <span className="font-semibold text-primary">JARVIS</span>
      </div>

      {/* Menu label */}
      <div className="px-4 mb-2">
        <span className="text-[10px] font-semibold text-tertiary uppercase tracking-widest">Menu</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_TOP.map(renderEntry)}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 space-y-1 mt-auto pt-2 border-t border-white/5">
        {user && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
            title={`${user.name} · ${user.email}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-primary truncate max-w-[140px]">{user.name}</span>
              <span className="text-[10px] text-tertiary truncate max-w-[140px]">{user.email}</span>
            </div>
          </div>
        )}

        <div className="flex gap-1">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-secondary hover:bg-white/5 hover:text-primary transition-all"
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-secondary hover:bg-rose-500/15 hover:text-rose-400 transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
