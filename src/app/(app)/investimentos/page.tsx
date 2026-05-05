'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, TrendingUp, Wallet, BarChart3, Activity,
  Bitcoin, Target, Pencil, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { Modal } from '@/components/ui/Modal';
import { InvestimentoForm } from '@/components/forms/InvestimentoForm';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { HiddenValue } from '@/components/ui/HiddenValue';
import { Investimento, CategoriaInvestimento, RendimentoMensal } from '@/types';
import { formatBRL, formatBRLCompact, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

type Aba = 'visao' | 'rendimentos' | 'categorias' | 'aportes';

export default function InvestimentosPage() {
  const [aba, setAba] = useState<Aba>('visao');
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [categorias, setCategorias] = useState<CategoriaInvestimento[]>([]);
  const [rendimentos, setRendimentos] = useState<RendimentoMensal[]>([]);
  const [btcPrice, setBtcPrice] = useState(0);
  const [btcAtualizado, setBtcAtualizado] = useState('');
  const [meta, setMeta] = useState<{ aporteMensal?: number | null; patrimonioAlvo?: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Investimento | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, catRes, rendRes, btcRes, metaRes] = await Promise.all([
      fetch('/api/investimentos').then(r => r.json()),
      fetch('/api/categorias-investimento').then(r => r.json()),
      fetch('/api/rendimentos-mensais').then(r => r.json()),
      fetch('/api/btc-price').then(r => r.json()).catch(() => ({ price: 0 })),
      fetch('/api/metas-investimento').then(r => r.json()).catch(() => ({ data: null })),
    ]);
    setInvestimentos(invRes.data || []);
    setCategorias(catRes.data || []);
    setRendimentos(rendRes.data || []);
    if (btcRes.price) {
      setBtcPrice(btcRes.price);
      setBtcAtualizado(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
    setMeta(metaRes.data || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalAportado   = useMemo(() => investimentos.reduce((s, i) => s + i.valor, 0), [investimentos]);
  const btcInvs         = useMemo(() => investimentos.filter(i => i.quantidadeBTC && i.quantidadeBTC > 0), [investimentos]);
  const totalBTC        = useMemo(() => btcInvs.reduce((s, i) => s + (i.quantidadeBTC ?? 0), 0), [btcInvs]);
  const btcAportado     = useMemo(() => btcInvs.reduce((s, i) => s + i.valor, 0), [btcInvs]);
  const btcAtual        = totalBTC * btcPrice;
  const btcPnL          = btcAtual - btcAportado;

  const rendimentoAcumulado = useMemo(() =>
    rendimentos.reduce((s, r) => s + (r.valorRendimento ?? 0), 0), [rendimentos]);

  const patrimonioTotal = useMemo(() => {
    const baseNaoBTC = totalAportado - btcAportado;
    const rendTotal  = rendimentos.reduce((s, r) => s + (r.valorRendimento ?? 0), 0);
    return baseNaoBTC + rendTotal + (btcPrice > 0 && totalBTC > 0 ? btcAtual : btcAportado);
  }, [totalAportado, btcAportado, rendimentos, btcAtual, btcPrice, totalBTC]);

  const mediaMensal = useMemo(() => {
    const comValor = rendimentos.filter(r => r.valorRendimento !== null && r.valorRendimento !== 0);
    if (!comValor.length) return 0;
    return comValor.reduce((s, r) => s + (r.valorRendimento ?? 0), 0) / comValor.length;
  }, [rendimentos]);

  const porCategoria = useMemo(() => categorias.map(cat => {
    const invs       = investimentos.filter(i => i.categoriaInvestimentoId === cat.id);
    const aportado   = invs.reduce((s, i) => s + i.valor, 0);
    const rends      = rendimentos.filter(r => r.categoriaInvestimentoId === cat.id);
    const rendAcum   = rends.reduce((s, r) => s + (r.valorRendimento ?? 0), 0);
    const btcCat     = invs.filter(i => i.quantidadeBTC && i.quantidadeBTC > 0);
    const qtdBTCCat  = btcCat.reduce((s, i) => s + (i.quantidadeBTC ?? 0), 0);
    const btcAportCat = btcCat.reduce((s, i) => s + i.valor, 0);
    const btcAtualCat = btcPrice > 0 && qtdBTCCat > 0 ? qtdBTCCat * btcPrice : btcAportCat;
    const patrimonioCat = (aportado - btcAportCat) + rendAcum + btcAtualCat;
    return { ...cat, aportado, rendimento: rendAcum, patrimonio: patrimonioCat };
  }).filter(c => c.aportado > 0 || rendimentos.some(r => r.categoriaInvestimentoId === c.id)),
  [categorias, investimentos, rendimentos, btcPrice]);

  const evolucaoChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rendimentos) {
      const key = `${r.ano}-${String(r.mes).padStart(2,'0')}`;
      map.set(key, (map.get(key) ?? 0) + (r.valorRendimento ?? 0));
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([key, rend]) => {
      const [ano, mes] = key.split('-');
      return { label: `${MESES_SHORT[Number(mes)-1]}/${ano.slice(2)}`, rendimento: rend };
    });
  }, [rendimentos]);

  const hoje = new Date();
  const aporteMesAtual = useMemo(() => investimentos
    .filter(i => { const d = new Date(i.data); return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth(); })
    .reduce((s, i) => s + i.valor, 0), [investimentos]);

  async function handleDelete(id: string) {
    if (!confirm('Excluir aporte?')) return;
    await fetch(`/api/investimentos/${id}`, { method: 'DELETE' });
    toast.success('Excluído'); load();
  }

  const ABAS: { key: Aba; label: string }[] = [
    { key: 'visao',       label: 'Visão Geral' },
    { key: 'rendimentos', label: 'Rendimentos' },
    { key: 'categorias',  label: 'Categorias'  },
    { key: 'aportes',     label: 'Aportes'     },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-card !rounded-2xl overflow-x-auto">
        {ABAS.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            className={cn('flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
              aba === a.key ? 'bg-blue-600 text-white shadow' : 'text-secondary hover:text-primary')}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── VISÃO GERAL ─────────────────────────────────────────────────────── */}
      {aba === 'visao' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { label: 'Patrimônio Total', value: patrimonioTotal,       color: 'text-blue-400',    icon: TrendingUp, prefix: ''                               },
              { label: 'Valor Aportado',   value: totalAportado,         color: 'text-indigo-300',  icon: Wallet,     prefix: ''                               },
              { label: 'Rendimento Acum.', value: rendimentoAcumulado,   color: rendimentoAcumulado >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: BarChart3, prefix: rendimentoAcumulado > 0 ? '+' : '' },
              { label: 'Média Mensal',     value: mediaMensal,           color: 'text-emerald-300', icon: Activity,   prefix: mediaMensal > 0 ? '+' : ''       },
            ] as const).map(({ label, value, color, icon: Icon, prefix }) => (
              <div key={label} className="glass-card p-3 sm:p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-secondary">{label}</span>
                  <Icon className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className={cn('text-base sm:text-xl font-bold tabular', color)}>
                  {prefix}<HiddenValue value={value} />
                </div>
              </div>
            ))}
          </div>

          {/* Bitcoin + Metas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ── Bitcoin card ── */}
            <div className="glass-card p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bitcoin className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-primary">Bitcoin (BTC)</span>
                </div>
                {btcPrice > 0 && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />AO VIVO
                  </span>
                )}
              </div>

              {totalBTC > 0 ? (
                <>
                  {/* Preço atual */}
                  <div>
                    <div className="text-[10px] text-secondary uppercase tracking-wide mb-0.5">Preço do Bitcoin</div>
                    <div className="text-2xl font-bold text-primary tabular">
                      {btcPrice > 0 ? formatBRL(btcPrice) : '—'}
                    </div>
                    {btcAtualizado && (
                      <div className="text-[10px] text-tertiary mt-0.5">{btcAtualizado}</div>
                    )}
                  </div>

                  <div className="h-px bg-white/10" />

                  {/* Carteira */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary">Quantidade</span>
                      <span className="text-sm font-semibold text-primary tabular">{totalBTC.toFixed(8)} BTC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary">Valor atual</span>
                      <span className="text-sm font-bold text-blue-400 tabular">
                        <HiddenValue value={btcAtual > 0 ? btcAtual : btcAportado} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-secondary">Total investido</span>
                      <span className="text-xs text-secondary tabular"><HiddenValue value={btcAportado} /></span>
                    </div>
                    {totalBTC > 0 && btcAportado > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-secondary">Preço médio</span>
                        <span className="text-xs text-secondary tabular">{formatBRL(btcAportado / totalBTC)}/BTC</span>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-white/10" />

                  {/* P&L destaque */}
                  <div className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl',
                    btcPnL >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  )}>
                    <span className="text-xs font-medium text-secondary">P&L</span>
                    <span className={cn('text-base font-bold tabular', btcPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {btcPnL >= 0 ? '+' : ''}<HiddenValue value={btcPnL} />
                      {btcAportado > 0 && (
                        <span className="text-[11px] ml-1.5 opacity-70">
                          ({((btcPnL / btcAportado) * 100).toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-secondary py-2 space-y-1">
                  <p>Nenhum aporte em Bitcoin registrado.</p>
                  <p className="text-tertiary">Crie uma categoria "Bitcoin" e registre aportes com a quantidade em BTC.</p>
                </div>
              )}
            </div>
            <MetasCard meta={meta} aporteMesAtual={aporteMesAtual} patrimonioTotal={patrimonioTotal} onSaved={load} />
          </div>

          {/* Por categoria */}
          {porCategoria.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-secondary px-1">Por categoria</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {porCategoria.map(cat => {
                  const rend = cat.patrimonio - cat.aportado;
                  const pct  = cat.aportado > 0 ? (rend / cat.aportado) * 100 : 0;
                  return (
                    <div key={cat.id} className="glass-card p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icone}</span>
                        <div>
                          <div className="text-sm font-medium text-primary">{cat.nome}</div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: cat.cor + '22', color: cat.cor }}>
                            {rend >= 0 ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-secondary">Aportado</span><span className="text-secondary tabular"><HiddenValue value={cat.aportado} /></span></div>
                        <div className="flex justify-between text-xs"><span className="text-secondary">Rendimento</span><span className={cn('tabular', cat.rendimento >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{cat.rendimento >= 0 ? '+' : ''}<HiddenValue value={cat.rendimento} /></span></div>
                        <div className="h-px bg-white/10" />
                        <div className="flex justify-between text-sm font-semibold"><span className="text-primary">Patrimônio</span><span className="text-blue-400 tabular"><HiddenValue value={cat.patrimonio} /></span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chart */}
          {evolucaoChart.length > 0 && (
            <GlassCard className="!p-4">
              <h3 className="text-sm font-medium text-primary mb-4">Rendimento mensal registrado</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={evolucaoChart} margin={{ left: -15, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="rgba(148,163,184,0.6)" fontSize={10} tickMargin={4} />
                  <YAxis stroke="rgba(148,163,184,0.6)" fontSize={10} tickFormatter={v => formatBRLCompact(v)} width={52} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="rendimento" name="Rendimento" fill="#34d399" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          <button onClick={() => { setEditing(null); setOpenForm(true); }}
            className="w-full py-3 rounded-2xl border border-dashed border-blue-500/30 text-blue-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-500/5 transition-all">
            <Plus className="w-4 h-4" /> Novo aporte
          </button>
        </div>
      )}

      {aba === 'rendimentos' && <RendimentosTab categorias={categorias} rendimentos={rendimentos} onRefresh={load} />}
      {aba === 'categorias'  && <CategoriasTab  categorias={categorias} onRefresh={load} />}
      {aba === 'aportes'     && (
        <AportesTab investimentos={investimentos} categorias={categorias} loading={loading}
          onEdit={inv => { setEditing(inv); setOpenForm(true); }} onDelete={handleDelete}
          onNew={() => { setEditing(null); setOpenForm(true); }} />
      )}

      <Modal open={openForm} onClose={() => setOpenForm(false)} title={editing ? 'Editar aporte' : 'Novo aporte'}>
        <InvestimentoForm initial={editing || undefined} onSuccess={() => { setOpenForm(false); load(); }} />
      </Modal>
    </div>
  );
}

// ─── Metas Card ───────────────────────────────────────────────────────────────

function MetasCard({ meta, aporteMesAtual, patrimonioTotal, onSaved }: {
  meta: { aporteMensal?: number | null; patrimonioAlvo?: number | null } | null;
  aporteMesAtual: number; patrimonioTotal: number; onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ aporteMensal: '', patrimonioAlvo: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (meta) setForm({ aporteMensal: meta.aporteMensal?.toString() ?? '', patrimonioAlvo: meta.patrimonioAlvo?.toString() ?? '' }); }, [meta]);
  async function salvar() {
    setSaving(true);
    try {
      await fetch('/api/metas-investimento', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aporteMensal: form.aporteMensal ? parseFloat(form.aporteMensal) : null, patrimonioAlvo: form.patrimonioAlvo ? parseFloat(form.patrimonioAlvo) : null }) });
      toast.success('Metas salvas!'); setEditing(false); onSaved();
    } finally { setSaving(false); }
  }
  const pctAporte    = meta?.aporteMensal    ? Math.min(100, (aporteMesAtual  / meta.aporteMensal)    * 100) : 0;
  const pctPatrimonio = meta?.patrimonioAlvo ? Math.min(100, (patrimonioTotal / meta.patrimonioAlvo) * 100) : 0;
  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" /><span className="text-sm font-medium text-primary">Metas</span></div>
        {!editing && <button onClick={() => setEditing(true)} className="p-1 text-secondary hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>}
      </div>
      {editing ? (
        <div className="space-y-3">
          <div><label className="text-[10px] text-secondary">Aporte mensal (R$)</label><input type="number" step="0.01" value={form.aporteMensal} onChange={e => setForm(f => ({ ...f, aporteMensal: e.target.value }))} className="glass-input mt-1 !py-2 !text-sm" placeholder="Ex: 1000" /></div>
          <div><label className="text-[10px] text-secondary">Meta de patrimônio (R$)</label><input type="number" step="0.01" value={form.patrimonioAlvo} onChange={e => setForm(f => ({ ...f, patrimonioAlvo: e.target.value }))} className="glass-input mt-1 !py-2 !text-sm" placeholder="Ex: 100000" /></div>
          <div className="flex gap-2">
            <button onClick={salvar} disabled={saving} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium">{saving ? 'Salvando…' : 'Salvar'}</button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-xl glass-card text-secondary text-sm">Cancelar</button>
          </div>
        </div>
      ) : (meta?.aporteMensal || meta?.patrimonioAlvo) ? (
        <div className="space-y-3">
          {meta.aporteMensal && (<div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-secondary capitalize">Aporte em {mesAtual}</span><span className="text-primary tabular">{formatBRL(aporteMesAtual)} / {formatBRL(meta.aporteMensal)}</span></div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pctAporte}%` }} /></div>
            <div className="text-right text-[10px] text-secondary">{pctAporte.toFixed(0)}%</div>
          </div>)}
          {meta.patrimonioAlvo && (<div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-secondary">Patrimônio alvo</span><span className="text-primary tabular">{pctPatrimonio.toFixed(1)}%</span></div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pctPatrimonio}%` }} /></div>
            <div className="flex justify-between text-[10px] text-tertiary"><HiddenValue value={patrimonioTotal} /><span>meta: <HiddenValue value={meta.patrimonioAlvo} /></span></div>
          </div>)}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-3">
          <p className="text-xs text-secondary text-center">Nenhuma meta definida.</p>
          <button onClick={() => setEditing(true)} className="px-4 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors">Definir metas</button>
        </div>
      )}
    </div>
  );
}

// ─── Rendimentos Tab ──────────────────────────────────────────────────────────

function RendimentosTab({ categorias, rendimentos, onRefresh }: {
  categorias: CategoriaInvestimento[]; rendimentos: RendimentoMensal[]; onRefresh: () => void;
}) {
  const hoje = new Date();
  const [catFiltro, setCatFiltro] = useState('all');
  const [form, setForm] = useState({ categoriaInvestimentoId: '', ano: hoje.getFullYear(), mes: hoje.getMonth() + 1, valorRendimento: '', percentual: '', observacao: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const rendFiltrados = catFiltro === 'all' ? rendimentos : rendimentos.filter(r => r.categoriaInvestimentoId === catFiltro);
  const grupos = useMemo(() => {
    const map = new Map<string, RendimentoMensal[]>();
    for (const r of rendFiltrados) {
      const key = `${r.ano}-${String(r.mes).padStart(2,'0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort(([a],[b]) => b.localeCompare(a)).map(([key, items]) => {
      const [ano, mesStr] = key.split('-');
      return { ano: Number(ano), mes: Number(mesStr), items };
    });
  }, [rendFiltrados]);
  async function salvar() {
    if (!form.categoriaInvestimentoId) { toast.error('Selecione uma categoria'); return; }
    if (!form.valorRendimento && !form.percentual) { toast.error('Informe R$ ou %'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/rendimentos-mensais', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoriaInvestimentoId: form.categoriaInvestimentoId, ano: form.ano, mes: form.mes,
          valorRendimento: form.valorRendimento ? parseFloat(form.valorRendimento) : null,
          percentual: form.percentual ? parseFloat(form.percentual) : null, observacao: form.observacao || null }) });
      if (!res.ok) throw new Error();
      toast.success('Rendimento salvo!'); setForm(f => ({ ...f, valorRendimento: '', percentual: '', observacao: '' })); onRefresh();
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  }
  async function deletar(id: string) { setDeleting(id); await fetch(`/api/rendimentos-mensais/${id}`, { method: 'DELETE' }); toast.success('Removido'); onRefresh(); setDeleting(null); }
  return (
    <div className="space-y-4">
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-medium text-primary">Registrar rendimento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="text-[10px] text-secondary uppercase tracking-wide">Categoria</label>
            <select value={form.categoriaInvestimentoId} onChange={e => setForm(f => ({ ...f, categoriaInvestimentoId: e.target.value }))} className="glass-input mt-1">
              <option value="">— Selecione —</option>
              {categorias.map(c => <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>{c.icone} {c.nome}</option>)}
            </select></div>
          <div><label className="text-[10px] text-secondary uppercase tracking-wide">Mês</label>
            <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: Number(e.target.value) }))} className="glass-input mt-1">
              {MESES_FULL.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select></div>
          <div><label className="text-[10px] text-secondary uppercase tracking-wide">Ano</label>
            <input type="number" value={form.ano} min={2020} max={2100} onChange={e => setForm(f => ({ ...f, ano: Number(e.target.value) }))} className="glass-input mt-1 tabular" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] text-secondary uppercase tracking-wide">Valor (R$)</label>
            <input type="number" step="0.01" value={form.valorRendimento} onChange={e => setForm(f => ({ ...f, valorRendimento: e.target.value }))} placeholder="Ex: 350.00" className="glass-input mt-1 tabular" /></div>
          <div><label className="text-[10px] text-secondary uppercase tracking-wide">Percentual (%)</label>
            <input type="number" step="0.01" value={form.percentual} onChange={e => setForm(f => ({ ...f, percentual: e.target.value }))} placeholder="Ex: 1.12" className="glass-input mt-1 tabular" /></div>
        </div>
        <div><label className="text-[10px] text-secondary uppercase tracking-wide">Observação (opcional)</label>
          <input type="text" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: CDB venceu, dividendo mensal…" className="glass-input mt-1" /></div>
        <button onClick={salvar} disabled={saving} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          {saving ? 'Salvando…' : 'Salvar rendimento'}
        </button>
        <p className="text-[10px] text-tertiary text-center">Registre R$ e/ou %. Se o mês já existir na categoria, será atualizado.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCatFiltro('all')} className={cn('px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0', catFiltro === 'all' ? 'bg-blue-600 text-white' : 'glass-card text-secondary')}>Todas</button>
        {categorias.map(c => (
          <button key={c.id} onClick={() => setCatFiltro(c.id)} className={cn('px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0', catFiltro === c.id ? 'text-white' : 'glass-card text-secondary')} style={catFiltro === c.id ? { background: c.cor } : {}}>
            {c.icone} {c.nome}
          </button>
        ))}
      </div>
      {grupos.length === 0
        ? <div className="glass-card p-8 text-center text-secondary text-sm">Nenhum rendimento registrado ainda.</div>
        : grupos.map(({ ano, mes, items }) => {
          const totalMes = items.reduce((s, r) => s + (r.valorRendimento ?? 0), 0);
          return (
            <div key={`${ano}-${mes}`} className="glass-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium text-primary">{MESES_FULL[mes-1]} {ano}</span>
                <span className={cn('text-sm font-semibold tabular', totalMes >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{totalMes >= 0 ? '+' : ''}{formatBRL(totalMes)}</span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg flex-shrink-0">{r.categoriaInvestimento?.icone ?? '📈'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-primary font-medium truncate">{r.categoriaInvestimento?.nome ?? '—'}</div>
                      {r.observacao && <div className="text-[10px] text-tertiary truncate">{r.observacao}</div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {r.valorRendimento !== null && <div className={cn('text-sm font-semibold tabular', (r.valorRendimento ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{(r.valorRendimento ?? 0) >= 0 ? '+' : ''}{formatBRL(r.valorRendimento ?? 0)}</div>}
                      {r.percentual !== null && <div className="text-[10px] text-secondary tabular">{r.percentual?.toFixed(2)}%</div>}
                    </div>
                    <button onClick={() => deletar(r.id)} disabled={deleting === r.id} className="p-1.5 text-secondary hover:text-rose-400 transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

// ─── Categorias Tab ───────────────────────────────────────────────────────────

const ICONES_OPT = ['📈','💰','🏦','🏠','🌎','₿','📊','💎','🔑','🏛️','⚡','🌱','🎯','🚀','💼'];
const CORES_OPT  = ['#3b82f6','#34d399','#f59e0b','#a5b4fc','#22d3ee','#fb7185','#f97316','#8b5cf6','#06b6d4','#10b981'];

function CategoriasTab({ categorias, onRefresh }: { categorias: CategoriaInvestimento[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<CategoriaInvestimento | null>(null);
  const [form, setForm] = useState({ nome: '', cor: '#3b82f6', icone: '📈' });
  const [saving, setSaving] = useState(false);
  function abrirNova() { setForm({ nome: '', cor: '#3b82f6', icone: '📈' }); setEditando(null); setShowForm(true); }
  function abrirEditar(cat: CategoriaInvestimento) { setForm({ nome: cat.nome, cor: cat.cor, icone: cat.icone }); setEditando(cat); setShowForm(true); }
  async function salvar() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    try {
      if (editando) { await fetch(`/api/categorias-investimento/${editando.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); toast.success('Atualizada'); }
      else          { await fetch('/api/categorias-investimento',                 { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); toast.success('Criada'); }
      setShowForm(false); onRefresh();
    } catch { toast.error('Erro'); } finally { setSaving(false); }
  }
  async function deletar(id: string) {
    if (!confirm('Excluir categoria?')) return;
    await fetch(`/api/categorias-investimento/${id}`, { method: 'DELETE' }); toast.success('Removida'); onRefresh();
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary">Crie categorias para organizar seus investimentos.</p>
        <button onClick={abrirNova} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium"><Plus className="w-4 h-4" /> Nova</button>
      </div>
      {showForm && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-primary">{editando ? 'Editar' : 'Nova categoria'}</span><button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-secondary" /></button></div>
          <div><label className="text-[10px] text-secondary uppercase tracking-wide">Nome</label><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="glass-input mt-1" placeholder="Ex: Renda Fixa, FIIs, Bitcoin…" /></div>
          <div>
            <label className="text-[10px] text-secondary uppercase tracking-wide mb-2 block">Ícone</label>
            <div className="flex flex-wrap gap-2">{ICONES_OPT.map(ic => (<button key={ic} onClick={() => setForm(f => ({ ...f, icone: ic }))} className={cn('text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all', form.icone === ic ? 'bg-blue-600 scale-110' : 'glass-card hover:scale-105')}>{ic}</button>))}</div>
          </div>
          <div>
            <label className="text-[10px] text-secondary uppercase tracking-wide mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">{CORES_OPT.map(cor => (<button key={cor} onClick={() => setForm(f => ({ ...f, cor }))} className={cn('w-7 h-7 rounded-full transition-all', form.cor === cor ? 'ring-2 ring-white scale-110' : 'hover:scale-105')} style={{ background: cor }} />))}</div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-2xl">{form.icone}</span>
            <span className="text-sm font-medium px-2.5 py-1 rounded-full" style={{ background: form.cor + '22', color: form.cor }}>{form.nome || 'Prévia'}</span>
          </div>
          <button onClick={salvar} disabled={saving} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">{saving ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar categoria'}</button>
        </div>
      )}
      {categorias.length === 0
        ? <div className="glass-card p-8 text-center"><p className="text-secondary text-sm">Nenhuma categoria ainda.</p><p className="text-tertiary text-xs mt-1">Comece criando suas categorias de investimento.</p></div>
        : <div className="space-y-2">{categorias.map(cat => (
          <div key={cat.id} className="glass-card p-3.5 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">{cat.icone}</span>
            <div className="flex-1 min-w-0"><span className="text-sm font-medium px-2.5 py-1 rounded-full" style={{ background: cat.cor + '22', color: cat.cor }}>{cat.nome}</span></div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => abrirEditar(cat)} className="p-1.5 text-secondary hover:text-primary rounded-lg hover:bg-white/10"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => deletar(cat.id)} className="p-1.5 text-secondary hover:text-rose-400 rounded-lg hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}

// ─── Aportes Tab ──────────────────────────────────────────────────────────────

function AportesTab({ investimentos, categorias, loading, onEdit, onDelete, onNew }: {
  investimentos: Investimento[]; categorias: CategoriaInvestimento[]; loading: boolean;
  onEdit: (inv: Investimento) => void; onDelete: (id: string) => void; onNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary">{investimentos.length} aportes registrados</p>
        <button onClick={onNew} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium"><Plus className="w-4 h-4" /> Novo</button>
      </div>
      <div className="sm:hidden glass-card !p-0 overflow-hidden divide-y divide-white/5">
        {loading ? <div className="p-4 space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />)}</div>
          : investimentos.length === 0 ? <div className="text-center py-10 text-secondary text-sm">Nenhum aporte.</div>
          : investimentos.map(inv => {
            const cat = categorias.find(c => c.id === inv.categoriaInvestimentoId);
            return (
              <div key={inv.id} className="flex items-center gap-2.5 px-3 py-2.5">
                <span className="text-xl flex-shrink-0">{cat?.icone ?? '📈'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-primary font-medium truncate">{inv.descricao}</div>
                  <div className="text-[10px] text-tertiary flex items-center gap-1.5">
                    <span>{formatDate(inv.data)}</span>
                    {cat && <span style={{ color: cat.cor }}>· {cat.nome}</span>}
                    {inv.quantidadeBTC && <span className="text-amber-400">· {inv.quantidadeBTC.toFixed(4)} BTC</span>}
                  </div>
                </div>
                <div className="text-sm text-indigo-300 font-semibold tabular shrink-0"><HiddenValue value={inv.valor} /></div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => onEdit(inv)} className="p-1 rounded hover:bg-white/10 text-secondary"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => onDelete(inv.id)} className="p-1 rounded hover:bg-rose-500/15 text-rose-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
      </div>
      <div className="hidden sm:block glass-card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-xs text-secondary uppercase">
            <th className="text-left px-5 py-3">Data</th><th className="text-left px-5 py-3">Descrição</th>
            <th className="text-left px-5 py-3">Categoria</th><th className="text-right px-5 py-3">Valor</th><th className="px-5 py-3 w-20" />
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-secondary">Carregando...</td></tr>
              : investimentos.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-secondary">Nenhum aporte.</td></tr>
              : investimentos.map(inv => {
                const cat = categorias.find(c => c.id === inv.categoriaInvestimentoId);
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3 text-secondary text-xs tabular">{formatDate(inv.data)}</td>
                    <td className="px-5 py-3 text-primary font-medium truncate max-w-[200px]">
                      {inv.descricao}
                      {inv.quantidadeBTC && <span className="ml-2 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full">{inv.quantidadeBTC.toFixed(4)} BTC</span>}
                    </td>
                    <td className="px-5 py-3">{cat && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: cat.cor + '22', color: cat.cor }}>{cat.icone} {cat.nome}</span>}</td>
                    <td className="px-5 py-3 text-right text-indigo-300 font-semibold tabular"><HiddenValue value={inv.valor} /></td>
                    <td className="px-5 py-3"><div className="flex gap-1 justify-end">
                      <button onClick={() => onEdit(inv)} className="p-1.5 rounded-lg hover:bg-white/10 text-secondary"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div></td>
                  </motion.tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
