'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, TrendingUp, Wallet, BarChart3, Activity,
  Bitcoin, Target, Pencil, ChevronDown, ChevronUp,
} from 'lucide-react';
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
import { formatBRL, formatBRLCompact, formatDate } from '@/lib/formatters';

// Helper: calculate current value of an investment
function calcValorAtual(inv: Investimento, btcPrice: number, taxaMap: Map<string, number>): number {
  if (inv.quantidadeBTC && inv.quantidadeBTC > 0 && btcPrice > 0) {
    return inv.quantidadeBTC * btcPrice;
  }
  const taxa = taxaMap.get(inv.classe) ?? 0;
  if (taxa === 0) return inv.valor;
  const hoje = new Date();
  const data = new Date(inv.data);
  const meses = Math.max(0, (hoje.getFullYear() - data.getFullYear()) * 12 + (hoje.getMonth() - data.getMonth()));
  return inv.valor * Math.pow(1 + taxa / 100, meses);
}

export default function InvestimentosPage() {
  // State
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [btcPrice, setBtcPrice] = useState(0);
  const [btcAtualizado, setBtcAtualizado] = useState('');
  const [taxaMap, setTaxaMap] = useState<Map<string, number>>(new Map());
  const [taxaInputs, setTaxaInputs] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<{ aporteMensal?: number | null; patrimonioAlvo?: number | null } | null>(null);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ aporteMensal: '', patrimonioAlvo: '' });
  const [rentOpen, setRentOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Investimento | null>(null);

  async function load() {
    setLoading(true);
    const [invRes, btcRes, rentRes, metaRes] = await Promise.all([
      fetch('/api/investimentos').then(r => r.json()),
      fetch('/api/btc-price').then(r => r.json()),
      fetch('/api/rentabilidade').then(r => r.json()),
      fetch('/api/metas-investimento').then(r => r.json()),
    ]);
    setInvestimentos(invRes.data || []);
    if (btcRes.price) {
      setBtcPrice(btcRes.price);
      setBtcAtualizado(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
    const map = new Map<string, number>();
    const inputs: Record<string, string> = {};
    for (const c of (rentRes.data || [])) {
      map.set(c.classe, c.taxaMensal);
      inputs[c.classe] = String(c.taxaMensal);
    }
    setTaxaMap(map);
    setTaxaInputs(inputs);
    setMeta(metaRes.data || null);
    if (metaRes.data) {
      setMetaForm({
        aporteMensal: metaRes.data.aporteMensal?.toString() || '',
        patrimonioAlvo: metaRes.data.patrimonioAlvo?.toString() || '',
      });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Derived values
  const totalAportado = useMemo(() => investimentos.reduce((s, i) => s + i.valor, 0), [investimentos]);
  const patrimonioTotal = useMemo(
    () => investimentos.reduce((s, i) => s + calcValorAtual(i, btcPrice, taxaMap), 0),
    [investimentos, btcPrice, taxaMap]
  );
  const rendimentoTotal = patrimonioTotal - totalAportado;
  const rendimentoMensal = useMemo(() => {
    return investimentos.reduce((s, inv) => {
      if (inv.quantidadeBTC && inv.quantidadeBTC > 0) return s;
      const taxa = taxaMap.get(inv.classe) ?? 0;
      const atual = calcValorAtual(inv, btcPrice, taxaMap);
      return s + (atual * taxa / 100);
    }, 0);
  }, [investimentos, btcPrice, taxaMap]);

  // BTC totals
  const btcInvestimentos = useMemo(() => investimentos.filter(i => i.quantidadeBTC && i.quantidadeBTC > 0), [investimentos]);
  const totalBTC = useMemo(() => btcInvestimentos.reduce((s, i) => s + (i.quantidadeBTC || 0), 0), [btcInvestimentos]);
  const btcAportado = useMemo(() => btcInvestimentos.reduce((s, i) => s + i.valor, 0), [btcInvestimentos]);
  const btcAtual = totalBTC * btcPrice;
  const btcPnL = btcAtual - btcAportado;

  // Current month aportes (for meta comparison)
  const hoje = new Date();
  const aporteMesAtual = useMemo(() => {
    return investimentos
      .filter(i => {
        const d = new Date(i.data);
        return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
      })
      .reduce((s, i) => s + i.valor, 0);
  }, [investimentos]);

  // Per-class breakdown
  const porClasse = useMemo(() => {
    const map = new Map<string, { aportado: number; atual: number }>();
    for (const inv of investimentos) {
      const prev = map.get(inv.classe) || { aportado: 0, atual: 0 };
      map.set(inv.classe, {
        aportado: prev.aportado + inv.valor,
        atual: prev.atual + calcValorAtual(inv, btcPrice, taxaMap),
      });
    }
    return CLASSES_INVESTIMENTO
      .map(c => ({ ...c, ...(map.get(c.value) || { aportado: 0, atual: 0 }) }))
      .filter(c => c.aportado > 0);
  }, [investimentos, btcPrice, taxaMap]);

  // Radial chart data (by atual)
  const radialData = porClasse.map(c => ({ nome: c.label, valor: c.atual, cor: c.cor }));

  // Evolution chart data
  const evolucao = useMemo(() => {
    const sorted = [...investimentos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    let accAportado = 0;
    let accAtual = 0;
    return sorted.map(inv => {
      accAportado += inv.valor;
      accAtual += calcValorAtual(inv, btcPrice, taxaMap);
      return {
        data: new Date(inv.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        aportado: accAportado,
        patrimonio: accAtual,
      };
    });
  }, [investimentos, btcPrice, taxaMap]);

  async function salvarTaxa(classe: string) {
    const val = parseFloat(taxaInputs[classe] || '0');
    if (isNaN(val)) return;
    const newMap = new Map(taxaMap);
    newMap.set(classe, val);
    setTaxaMap(newMap);
    await fetch('/api/rentabilidade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classe, taxaMensal: val }),
    });
  }

  async function salvarMeta() {
    const res = await fetch('/api/metas-investimento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aporteMensal: metaForm.aporteMensal ? parseFloat(metaForm.aporteMensal) : null,
        patrimonioAlvo: metaForm.patrimonioAlvo ? parseFloat(metaForm.patrimonioAlvo) : null,
      }),
    });
    const d = await res.json();
    setMeta(d.data);
    setEditandoMeta(false);
    toast.success('Metas salvas!');
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir aporte?')) return;
    await fetch(`/api/investimentos/${id}`, { method: 'DELETE' });
    toast.success('Excluído');
    load();
  }

  const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' });
  const mesNomeCapitalized = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);

  return (
    <div className="space-y-3 sm:space-y-4">

      {/* Row 1 — Header + 4 stat cards */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-base sm:text-lg font-semibold text-primary">Investimentos</h1>
        <button
          onClick={() => { setEditing(null); setOpenForm(true); }}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Novo aporte
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1 — Patrimônio Total */}
        <div className="glass-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-secondary text-[10px] sm:text-xs mb-0.5">
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Patrimônio Total
          </div>
          <div className="text-blue-400 text-xl sm:text-3xl font-bold tabular leading-tight">
            <HiddenValue value={patrimonioTotal} />
          </div>
        </div>

        {/* Card 2 — Valor Aportado */}
        <div className="glass-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-secondary text-[10px] sm:text-xs mb-0.5">
            <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Valor Aportado
          </div>
          <div className="text-indigo-300 text-xl sm:text-3xl font-bold tabular leading-tight">
            <HiddenValue value={totalAportado} />
          </div>
        </div>

        {/* Card 3 — Rendimento Total */}
        <div className="glass-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-secondary text-[10px] sm:text-xs mb-0.5">
            <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Rendimento Total
          </div>
          <div className={`text-xl sm:text-3xl font-bold tabular leading-tight ${rendimentoTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {rendimentoTotal >= 0 ? '+' : ''}
            <HiddenValue value={rendimentoTotal} />
          </div>
        </div>

        {/* Card 4 — Rendimento Mensal Est. */}
        <div className="glass-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-secondary text-[10px] sm:text-xs mb-0.5">
            <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Rend. Mensal Est.
          </div>
          <div className="text-emerald-300 text-xl sm:text-3xl font-bold tabular leading-tight">
            +<HiddenValue value={rendimentoMensal} />
          </div>
        </div>
      </div>

      {/* Row 2 — Bitcoin ao Vivo + Metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Card A — Bitcoin ao Vivo */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-primary">Bitcoin (BTC)</span>
            </div>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AO VIVO
            </span>
          </div>

          {btcPrice > 0 ? (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-secondary mb-0.5">Preço atual</div>
                <div className="text-lg font-bold text-amber-400 tabular">{formatBRL(btcPrice)}</div>
                {btcAtualizado && (
                  <div className="text-[10px] text-tertiary mt-0.5">Atualizado às {btcAtualizado}</div>
                )}
              </div>

              {totalBTC > 0 ? (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary">Quantidade</span>
                    <span className="text-amber-300 tabular font-medium">{totalBTC.toFixed(8)} BTC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary text-xs">Valor atual</span>
                    <span className="text-blue-400 font-bold tabular text-sm">
                      <HiddenValue value={btcAtual} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary">Aportado</span>
                    <span className="text-secondary tabular">
                      <HiddenValue value={btcAportado} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary">P&amp;L</span>
                    <span className={`font-semibold tabular ${btcPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {btcPnL >= 0 ? '+' : ''}<HiddenValue value={btcPnL} />
                    </span>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-secondary">Nenhum BTC registrado. Adicione um aporte com a classe Criptomoedas e informe a quantidade de BTC.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-secondary text-xs">Não foi possível carregar o preço do Bitcoin.</div>
          )}
        </div>

        {/* Card B — Metas de Investimento */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-primary">Metas de Investimento</span>
            </div>
            {!editandoMeta && (
              <button
                onClick={() => setEditandoMeta(true)}
                className="p-1 rounded hover:bg-white/10 text-secondary transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {editandoMeta ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-secondary mb-1">Meta de aporte mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1000"
                  className="glass-input text-sm"
                  value={metaForm.aporteMensal}
                  onChange={e => setMetaForm(f => ({ ...f, aporteMensal: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] text-secondary mb-1">Meta de patrimônio (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100000"
                  className="glass-input text-sm"
                  value={metaForm.patrimonioAlvo}
                  onChange={e => setMetaForm(f => ({ ...f, patrimonioAlvo: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={salvarMeta}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs font-medium hover:shadow-lg transition-all"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditandoMeta(false)}
                  className="flex-1 py-2 rounded-lg bg-white/10 text-secondary text-xs hover:bg-white/15 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : meta ? (
            <div className="space-y-4">
              {meta.aporteMensal ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-secondary">Aporte em {mesNomeCapitalized}</span>
                    <span className="text-primary tabular">
                      <HiddenValue value={aporteMesAtual} /> / <HiddenValue value={meta.aporteMensal} />
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${Math.min(100, (aporteMesAtual / meta.aporteMensal) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-tertiary mt-1">
                    {Math.min(100, (aporteMesAtual / meta.aporteMensal) * 100).toFixed(0)}% da meta mensal
                  </div>
                </div>
              ) : null}

              {meta.patrimonioAlvo ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-secondary">Meta de Patrimônio</span>
                    <span className="text-primary tabular">
                      {Math.min(100, (patrimonioTotal / meta.patrimonioAlvo) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${Math.min(100, (patrimonioTotal / meta.patrimonioAlvo) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-tertiary mt-1">
                    <HiddenValue value={patrimonioTotal} /> de <HiddenValue value={meta.patrimonioAlvo} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 gap-3">
              <p className="text-xs text-secondary text-center">Defina metas de aporte mensal e patrimônio alvo para acompanhar seu progresso.</p>
              <button
                onClick={() => setEditandoMeta(true)}
                className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-colors"
              >
                Definir metas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 3 — Rentabilidade por Classe (collapsible) */}
      <div className="glass-card p-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setRentOpen(o => !o)}
        >
          <div className="text-left">
            <div className="text-sm font-medium text-primary">Rentabilidade Mensal por Classe</div>
            <div className="text-[10px] text-secondary mt-0.5">Configure o retorno mensal estimado (%) para calcular o patrimônio atual</div>
          </div>
          {rentOpen
            ? <ChevronUp className="w-4 h-4 text-secondary shrink-0" />
            : <ChevronDown className="w-4 h-4 text-secondary shrink-0" />
          }
        </button>

        {rentOpen && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CLASSES_INVESTIMENTO.map(classe => (
              <div key={classe.value} className="space-y-1.5">
                <label className="block text-xs font-medium text-secondary">{classe.label}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="glass-input text-xs tabular flex-1"
                    value={taxaInputs[classe.value] || ''}
                    onChange={e => setTaxaInputs(prev => ({ ...prev, [classe.value]: e.target.value }))}
                    onBlur={() => salvarTaxa(classe.value)}
                    placeholder="0"
                  />
                  <span className="text-[10px] text-secondary shrink-0">% a.m.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 4 — Por Classe */}
      {porClasse.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {porClasse.map(c => {
            const diff = c.atual - c.aportado;
            const pct = c.aportado > 0 ? (diff / c.aportado) * 100 : 0;
            return (
              <div key={c.value} className="glass-card p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                  <span className="text-xs text-secondary truncate">{c.label}</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-secondary">Aportado</span>
                    <span className="text-xs text-secondary tabular">
                      <HiddenValue value={c.aportado} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-secondary">Atual</span>
                    <span className="text-sm font-semibold text-primary tabular">
                      <HiddenValue value={c.atual} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-secondary">Rend.</span>
                    <span className={`text-xs font-medium tabular ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {diff >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Row 5 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="lg:col-span-1 !p-3 sm:!p-5">
          <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Por classe de ativo</h3>
          {radialData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-secondary text-sm">Sem dados</div>
          ) : (
            <RadialChart data={radialData} size={190} />
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2 !p-3 sm:!p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-primary text-sm sm:text-base">Evolução acumulada</h3>
            <div className="flex items-center gap-3 text-[10px] text-secondary">
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-violet-400 inline-block" />Aportado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-blue-400 inline-block" />Patrimônio</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={evolucao} margin={{ left: -15, right: 5, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="data" stroke="rgba(148,163,184,0.6)" fontSize={10} tickMargin={4} />
              <YAxis stroke="rgba(148,163,184,0.6)" fontSize={10} tickFormatter={(v) => formatBRLCompact(v)} width={50} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="aportado" stroke="#a5b4fc" fill="url(#violetGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="patrimonio" stroke="#60a5fa" fill="url(#blueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Row 6 — Histórico */}
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm text-primary font-medium truncate">{inv.descricao}</span>
                      {inv.quantidadeBTC && inv.quantidadeBTC > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium tabular shrink-0">
                          {inv.quantidadeBTC.toFixed(4)} BTC
                        </span>
                      )}
                    </div>
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
                <th className="text-right px-5 py-3">Aportado</th>
                <th className="text-right px-5 py-3">Atual</th>
                <th className="px-5 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-secondary">Carregando...</td></tr>
              ) : investimentos.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-secondary">Nenhum aporte registrado.</td></tr>
              ) : (
                investimentos.map((inv) => {
                  const classe = CLASSES_INVESTIMENTO.find((c) => c.value === inv.classe);
                  const valorAtual = calcValorAtual(inv, btcPrice, taxaMap);
                  const diff = valorAtual - inv.valor;
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 text-secondary text-xs tabular">{formatDate(inv.data)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-medium truncate max-w-[160px]">{inv.descricao}</span>
                          {inv.quantidadeBTC && inv.quantidadeBTC > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium tabular shrink-0">
                              {inv.quantidadeBTC.toFixed(4)} BTC
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">{classe && <Badge color={classe.cor}>{classe.label}</Badge>}</td>
                      <td className="px-5 py-3 text-right text-indigo-300 font-semibold tabular"><HiddenValue value={inv.valor} /></td>
                      <td className="px-5 py-3 text-right tabular">
                        <div className={`font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <HiddenValue value={valorAtual} />
                        </div>
                        {diff !== 0 && (
                          <div className={`text-[10px] ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {diff >= 0 ? '+' : ''}{formatBRL(diff)}
                          </div>
                        )}
                      </td>
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
