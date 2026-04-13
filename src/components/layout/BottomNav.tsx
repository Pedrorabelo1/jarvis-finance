'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Repeat,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LancamentoForm } from '@/components/forms/LancamentoForm';
import { Modal } from '@/components/ui/Modal';

// Relatórios removido do nav mobile — acessível via Dashboard
const itemsLeft = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lanç.', icon: ArrowLeftRight },
];

const itemsRight = [
  { href: '/fixas', label: 'Fixas', icon: Repeat },
  { href: '/investimentos', label: 'Invest.', icon: TrendingUp },
];

export function BottomNav() {
  const pathname = usePathname();
  const [openQuick, setOpenQuick] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-card rounded-none rounded-t-2xl border-b-0 border-l-0 border-r-0 px-2 pt-2 pb-safe-or-3 flex items-end justify-around"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {itemsLeft.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
                active ? 'text-blue-400' : 'text-secondary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* FAB — center */}
        <button
          onClick={() => setOpenQuick(true)}
          className="-mt-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-xl text-white flex-shrink-0"
          aria-label="Novo lançamento"
        >
          <Plus className="w-7 h-7" />
        </button>

        {itemsRight.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
                active ? 'text-blue-400' : 'text-secondary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Modal open={openQuick} onClose={() => setOpenQuick(false)} title="Novo lançamento">
        <LancamentoForm onSuccess={() => setOpenQuick(false)} />
      </Modal>
    </>
  );
}
