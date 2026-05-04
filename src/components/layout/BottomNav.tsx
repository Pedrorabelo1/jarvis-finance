'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Repeat,
  Tags,
  TrendingUp,
  FileBarChart,
  FileUp,
  Activity,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { LancamentoForm } from '@/components/forms/LancamentoForm';
import { Modal } from '@/components/ui/Modal';

const atividadeItems = [
  { href: '/lancamentos', label: 'Lançamentos',      icon: ArrowLeftRight },
  { href: '/fixas',       label: 'Despesas Fixas',   icon: Repeat         },
  { href: '/categorias',  label: 'Categorias',       icon: Tags           },
  { href: '/importar',    label: 'Importar Extrato', icon: FileUp         },
];

const atividadeHrefs = atividadeItems.map((i) => i.href);

export function BottomNav() {
  const pathname = usePathname();
  const [openQuick, setOpenQuick]       = useState(false);
  const [openAtividade, setOpenAtividade] = useState(false);

  const atividadeActive = atividadeHrefs.some((h) => pathname.startsWith(h));

  return (
    <>
      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-card rounded-none rounded-t-2xl border-b-0 border-l-0 border-r-0 px-2 pt-2 flex items-end justify-around"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {/* Início */}
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            pathname.startsWith('/dashboard') ? 'text-blue-400' : 'text-secondary'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Início</span>
        </Link>

        {/* Atividade — opens bottom sheet */}
        <button
          onClick={() => setOpenAtividade(true)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            atividadeActive ? 'text-blue-400' : 'text-secondary'
          )}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-medium">Atividade</span>
        </button>

        {/* FAB */}
        <button
          onClick={() => setOpenQuick(true)}
          className="-mt-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-xl text-white flex-shrink-0"
          aria-label="Novo lançamento"
        >
          <Plus className="w-7 h-7" />
        </button>

        {/* Investimentos */}
        <Link
          href="/investimentos"
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            pathname.startsWith('/investimentos') ? 'text-blue-400' : 'text-secondary'
          )}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-medium">Invest.</span>
        </Link>

        {/* Relatórios */}
        <Link
          href="/relatorios"
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg flex-1',
            pathname.startsWith('/relatorios') ? 'text-blue-400' : 'text-secondary'
          )}
        >
          <FileBarChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Relatórios</span>
        </Link>
      </nav>

      {/* ── Atividade sheet ─────────────────────────────────────────────── */}
      {openAtividade && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenAtividade(false)}
          />

          {/* Sheet */}
          <div className="relative glass-card-strong !rounded-t-3xl !rounded-b-none border-b-0 border-l-0 border-r-0 px-4 pt-4 animate-slide-up"
            style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-primary">Atividade</span>
              </div>
              <button
                onClick={() => setOpenAtividade(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-items */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              {atividadeItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpenAtividade(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all',
                      active
                        ? 'bg-gradient-to-r from-blue-500/25 to-blue-700/25 text-primary border border-blue-500/30'
                        : 'bg-white/5 text-secondary hover:bg-white/10 hover:text-primary'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick-add modal ─────────────────────────────────────────────── */}
      <Modal open={openQuick} onClose={() => setOpenQuick(false)} title="Novo lançamento">
        <LancamentoForm onSuccess={() => setOpenQuick(false)} />
      </Modal>
    </>
  );
}
