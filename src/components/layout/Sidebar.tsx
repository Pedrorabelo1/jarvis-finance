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
  LogOut,
  FileUp,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

type NavItem  = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label: string; icon: React.ElementType; children: NavItem[] };
type NavEntry = NavItem | NavGroup;

function isGroup(e: NavEntry): e is NavGroup { return 'children' in e; }

const NAV: NavEntry[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  {
    label: 'Atividade',
    icon: Activity,
    children: [
      { href: '/lancamentos', label: 'Lançamentos',    icon: ArrowLeftRight },
      { href: '/fixas',       label: 'Despesas Fixas', icon: Repeat         },
      { href: '/categorias',  label: 'Categorias',     icon: Tags           },
      { href: '/importar',    label: 'Importar',       icon: FileUp         },
    ],
  },
  { href: '/investimentos', label: 'Investimentos', icon: TrendingUp  },
  { href: '/relatorios',    label: 'Relatórios',    icon: FileBarChart },
];

interface SidebarProps {
  user?: { name: string; email: string } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const atividadeHrefs = ['/lancamentos', '/fixas', '/categorias', '/importar'];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Atividade: atividadeHrefs.some(h => pathname.startsWith(h)),
  });

  const toggle = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-[220px] flex-col bg-white border-r border-slate-200">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-100">
        <div className="w-6 h-6 flex-shrink-0">
          <Logo size={24} className="w-full h-full object-contain" />
        </div>
        <span className="font-bold text-slate-900 tracking-wide text-sm">JARVIS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(entry => {
          if (!isGroup(entry)) {
            const Icon   = entry.icon;
            const active = pathname.startsWith(entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {entry.label}
              </Link>
            );
          }

          const GroupIcon   = entry.icon;
          const isOpen      = !!openGroups[entry.label];
          const groupActive = entry.children.some(c => pathname.startsWith(c.href));

          return (
            <div key={entry.label}>
              <button
                onClick={() => toggle(entry.label)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  groupActive
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                <GroupIcon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-150', isOpen ? 'rotate-180' : '')} />
              </button>

              <div className={cn('overflow-hidden transition-all duration-150', isOpen ? 'max-h-48' : 'max-h-0')}>
                <div className="pt-0.5 pb-0.5 space-y-0.5">
                  {entry.children.map(child => {
                    const ChildIcon = child.icon;
                    const active    = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-lg text-sm transition-colors',
                          active
                            ? 'bg-slate-100 text-slate-900 font-medium'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        )}
                      >
                        <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom — user + logout */}
      <div className="px-3 pb-4 pt-3 border-t border-slate-100 space-y-0.5">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
