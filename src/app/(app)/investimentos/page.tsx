'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { Modal } from '@/components/ui/Modal';
import { InvestimentoForm } from '@/components/forms/InvestimentoForm';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { RadialChart } from '@/components/charts/RadialChart';
import { Badge } from '@/components/ui/Badge';
import { HiddenValue } from '@/components/ui/HiddenValue';
import { Investimento, CLASSES_INVESTIMENTO } from '@/types';
import { formatBRLCompact, formatDate } from '@/lib/formatters';

export default function InvestimentosPage() {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Investimento | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/investimentos');
    const d = await r.json();
    setInvestimentos(d.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Excluir aporte?')) return;
    const r = await fetch(`/api/investimentos/${id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('Erro'); return; }
    toast.success('Excluído');
    load();
  }

  const total = investimentos.reduce((s, i) => s + i.valor, 0);

  const porClasse = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of investimentos) {
      map.set(inv.classe, (map.get(inv.classe) || 0) + inv.valor);
    }
    return CLASSES_INVESTIMENTO.map((c) => ({
      nome: c.label,
      valor: map.get(c.value) || 0,
      cor: c.cor,
    })).filter((c) => c.valor > 0);
  }, [investimentos]);

  const evolucao = useMemo(() => {
    const sorted = [...investimentos].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );
    let acc = 0;
    return sorted.map((inv) => {
      acc += inv.valor;
      return {
        data: new Date(inv.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        valor: acc,
      };
    });
  }, [investimentos]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Total geral */}
      <div className="glass-card-strong p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <div className="text-[10px] sm:text-sm text-secondary">Patrimônio aportado</div>
            <div className="text-xl sm:text-3xl font-bold text-primary tabular">
              <HiddenValue value={total} />
            </div>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setOpenForm(true); }}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 shadow-md"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Novo aporte
        </button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="lg:col-span-1 !p-3 sm:!p-5">
          <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Por classe de ativo</h3>
          {porClasse.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-secondary text-sm">Sem dados</div>
          ) : (
            <RadialChart data={porClasse} size={190} />
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2 !p-3 sm:!p-5">
          <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Evolução acumulada</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={evolucao} margin={{ left: -15, right: 5, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="data" stroke="rgba(148,163,184,0.6)" fontSize={10} tickMargin={4} />
              <YAxis stroke="rgba(148,163,184,0.6)" fontSize={10} tickFormatter={(v) => formatBRLCompact(v)} width={50} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="valor" stroke="#a5b4fc" fill="url(#violetGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Lista de aportes */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/10">
          <h3 className="text-primary text-sm sm:text-base">Histórico de aportes</h3>
        </div>

        {/* Mobile: card list */}
        <div className="sm:hidden divide-y divide-white/5">
          {loading ? (
            <div className="p-3 space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : investimentos.length === 0 ? (
            <div className="text-center py-10 text-secondary text-sm">Nenhum aporte registrado.</div>
          ) : (
            investimentos.map((inv) => {
              const classe = CLASSES_INVESTIMENTO.find((c) => c.value === inv.classe);
              return (
                <div key={inv.id} className="flex items-center gap-2.5 px-3 py-2.5 active:bg-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-primary font-medium truncate">{inv.descricao}</div>
                    <div className="text-[10px] text-tertiary">
                      {formatDate(inv.data)}{classe && <span> · {classe.label}</span>}
                    </div>
                  </div>
                  <div className="text-sm text-indigo-300 font-semibold tabular shrink-0">
                    <HiddenValue value={inv.valor} />
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => { setEditing(inv); setOpenForm(true); }} className="p-1 rounded hover:bg-white/10 text-secondary"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(inv.id)} className="p-1 rounded hover:bg-rose-500/15 text-rose-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-secondary uppercase">
                <th className="text-left px-5 py-3">Data</th>
                <th className="text-left px-5 py-3">Descrição</th>
                <th className="text-left px-5 py-3">Classe</th>
                <th className="text-right px-5 py-3">Valor</th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-secondary">Carregando...</td></tr>
              ) : investimentos.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-secondary">Nenhum aporte registrado.</td></tr>
              ) : (
                investimentos.map((inv) => {
                  const classe = CLASSES_INVESTIMENTO.find((c) => c.value === inv.classe);
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 text-secondary text-xs tabular">{formatDate(inv.data)}</td>
                      <td className="px-5 py-3 text-primary font-medium truncate max-w-[200px]">{inv.descricao}</td>
                      <td className="px-5 py-3">{classe && <Badge color={classe.cor}>{classe.label}</Badge>}</td>
                      <td className="px-5 py-3 text-right text-indigo-300 font-semibold tabular"><HiddenValue value={inv.valor} /></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setEditing(inv); setOpenForm(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-secondary"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={openForm} onClose={() => setOpenForm(false)} title={editing ? 'Editar aporte' : 'Novo aporte'}>
        <InvestimentoForm initial={editing || undefined} onSuccess={() => { setOpenForm(false); load(); }} />
      </Modal>
    </div>
  );
}
