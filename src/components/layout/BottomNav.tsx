'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, Repeat, Tags, TrendingUp,
  FileBarChart, FileUp, Activity, Plus, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LancamentoForm } from '@/components/forms/LancamentoForm';
import { Modal } from '@/components/ui/Modal';

const atividadeItems = [
  { href: '/lancamentos', label: 'Lançamentos',    icon: ArrowLeftRight },
  { href: '/fixas',       label: 'Despesas Fixas', icon: Repeat         },
  { href: '/categorias',  label: 'Categorias',     icon: Tags           },
  { href: '/importar',    label: 'Importar',       icon: FileUp         },
];

const atividadeHrefs = atividadeItems.map(i => i.href);

export function BottomNav() {
  const pathname = usePathname();
  const [openQuick,     setOpenQuick]     = useState(false);
  const [openAtividade, setOpenAtividade] = useState(false);

  const atividadeActive = atividadeHrefs.some(h => pathname.startsWith(h));

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 pt-2 flex items-end justify-around"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <Link
          href="/dashboard"
          className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            pathname.startsWith('/dashboard') ? 'text-slate-900' : 'text-slate-400')}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        <button
          onClick={() => setOpenAtividade(true)}
          className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            atividadeActive ? 'text-slate-900' : 'text-slate-400')}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-medium">Atividade</span>
        </button>

        {/* FAB */}
        <button
          onClick={() => setOpenQuick(true)}
          className="-mt-5 w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-lg text-white flex-shrink-0"
        >
          <Plus className="w-6 h-6" />
        </button>

        <Link
          href="/investimentos"
          className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            pathname.startsWith('/investimentos') ? 'text-slate-900' : 'text-slate-400')}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-medium">Invest.</span>
        </Link>

        <Link
          href="/relatorios"
          className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            pathname.startsWith('/relatorios') ? 'text-slate-900' : 'text-slate-400')}
        >
          <FileBarChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Relatórios</span>
        </Link>
      </nav>

      {/* Atividade sheet */}
      {openAtividade && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpenAtividade(false)} />
          <div
            className="relative bg-white rounded-t-2xl border-t border-slate-200 px-4 pt-4 animate-slide-up"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
          >
            <div className="w-8 h-1 rounded-full bg-slate-200 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-800">Atividade</span>
              <button onClick={() => setOpenAtividade(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pb-2">
              {atividadeItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpenAtividade(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal open={openQuick} onClose={() => setOpenQuick(false)} title="Novo lançamento">
        <LancamentoForm onSuccess={() => setOpenQuick(false)} />
      </Modal>
    </>
  );
}
