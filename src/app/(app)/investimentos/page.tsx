'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
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

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Excluir aporte?')) return;
    const r = await fetch(`/api/investimentos/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      toast.error('Erro');
      return;
    }
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
      name: c.label,
      value: map.get(c.value) || 0,
      color: c.cor,
    })).filter((c) => c.value > 0);
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
    <div className="space-y-4">
      {/* Total geral */}
      <div className="glass-card-strong p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-sm text-secondary">Patrimônio total aportado</div>
            <div className="text-3xl font-bold text-primary tabular">
              <HiddenValue value={total} />
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white text-sm font-medium flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo aporte
        </button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-1">
          <h3 className="text-primary mb-4">Por classe de ativo</h3>
          {porClasse.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-secondary text-sm">Sem dados</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={porClasse}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {porClasse.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {porClasse.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span className="text-secondary">{c.name}</span>
                    </div>
                    <span className="text-primary font-medium tabular">
                      {((c.value / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-primary mb-4">Evolução acumulada</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={evolucao}>
              <defs>
                <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="data" stroke="rgba(148,163,184,0.6)" fontSize={11} />
              <YAxis
                stroke="rgba(148,163,184,0.6)"
                fontSize={11}
                tickFormatter={(v) => formatBRLCompact(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="valor" stroke="#a5b4fc" fill="url(#violetGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de aportes */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h3 className="text-primary">Histórico de aportes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-secondary uppercase">
                <th className="text-left px-5 py-3">Data</th>
                <th className="text-left px-5 py-3">Descrição</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Classe</th>
                <th className="text-right px-5 py-3">Valor</th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-secondary">
                    Carregando...
                  </td>
                </tr>
              ) : investimentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-secondary">
                    Nenhum aporte registrado.
                  </td>
                </tr>
              ) : (
                investimentos.map((inv) => {
                  const classe = CLASSES_INVESTIMENTO.find((c) => c.value === inv.classe);
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-5 py-3 text-secondary text-xs tabular">{formatDate(inv.data)}</td>
                      <td className="px-5 py-3 text-primary font-medium">{inv.descricao}</td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        {classe && <Badge color={classe.cor}>{classe.label}</Badge>}
                      </td>
                      <td className="px-5 py-3 text-right text-indigo-300 font-semibold tabular">
                        <HiddenValue value={inv.valor} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditing(inv);
                              setOpenForm(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-secondary"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? 'Editar aporte' : 'Novo aporte'}
      >
        <InvestimentoForm
          initial={editing || undefined}
          onSuccess={() => {
            setOpenForm(false);
            load();
          }}
        />
      </Modal>
    </div>
  );
}
