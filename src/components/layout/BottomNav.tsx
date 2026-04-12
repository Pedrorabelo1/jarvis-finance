'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Repeat,
  TrendingUp,
  FileBarChart,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LancamentoForm } from '@/components/forms/LancamentoForm';
import { Modal } from '@/components/ui/Modal';

const items = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lanç.', icon: ArrowLeftRight },
  { href: '/fixas', label: 'Fixas', icon: Repeat },
  { href: '/investimentos', label: 'Invest.', icon: TrendingUp },
  { href: '/relatorios', label: 'Relat.', icon: FileBarChart },
];

export function BottomNav() {
  const pathname = usePathname();
  const [openQuick, setOpenQuick] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-card rounded-none rounded-t-2xl border-b-0 border-l-0 border-r-0 px-2 pt-2 pb-3 flex items-end justify-around">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg flex-1',
                active ? 'text-blue-400' : 'text-secondary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* FAB */}
        <button
          onClick={() => setOpenQuick(true)}
          className="-mt-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-xl text-white"
          aria-label="Novo lançamento"
        >
          <Plus className="w-7 h-7" />
        </button>

        {items.slice(2, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg flex-1',
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
