'use client';

import { useState, useEffect } from 'react';
import { Download, Printer, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { Badge } from '@/components/ui/Badge';
import { HiddenValue } from '@/components/ui/HiddenValue';
import { formatBRL, formatBRLCompact, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Periodo = 'mes' | 'trimestre' | 'semestre' | 'ano' | 'custom';
type Tab = 'resumo' | 'categorias' | 'evolucao' | 'top';

export default function RelatoriosPage() {
  const today = new Date();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [start, setStart] = useState<string>(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [end, setEnd] = useState<string>(
    new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
  );
  const [tab, setTab] = useState<Tab>('resumo');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function applyPeriodo(p: Periodo) {
    setPeriodo(p);
    const now = new Date();
    let s: Date, e: Date;
    switch (p) {
      case 'mes':
        s = new Date(now.getFullYear(), now.getMonth(), 1);
        e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'trimestre':
        s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'semestre':
        s = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'ano':
        s = new Date(now.getFullYear(), 0, 1);
        e = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        return;
    }
    setStart(s.toISOString().slice(0, 10));
    setEnd(e.toISOString().slice(0, 10));
  }

  useEffect(() => {
    setLoading(true);
    const endPlus = new Date(end);
    endPlus.setDate(endPlus.getDate() + 1);
    fetch(`/api/relatorios?start=${start}&end=${endPlus.toISOString().slice(0, 10)}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setLoading(false);
      });
  }, [start, end]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor'].join(','),
      ...data.lancamentos.map((l: any) =>
        [
          formatDate(l.data),
          `"${l.descricao.replace(/"/g, '""')}"`,
          l.tipo,
          `"${l.categoria.nome}"`,
          l.valor.toFixed(2).replace('.', ','),
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([`\uFEFF${rows}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${start}-${end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filtros */}
      <div className="glass-card p-3 sm:p-4 space-y-2 no-print">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
          <span className="text-[10px] sm:text-xs text-secondary uppercase font-medium">Período</span>
        </div>

        <div className="flex flex-wrap gap-0.5 p-0.5 rounded-lg bg-white/5 border border-white/10 w-fit">
          {(['mes', 'trimestre', 'semestre', 'ano', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => applyPeriodo(p)}
              className={cn(
                'px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all',
                periodo === p ? 'bg-blue-500/20 text-primary' : 'text-secondary'
              )}
            >
              {p === 'mes' ? 'Mês' : p === 'custom' ? 'Custom' : p === 'trimestre' ? 'Tri.' : p === 'semestre' ? 'Sem.' : 'Ano'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={start}
            onChange={(e) => { setStart(e.target.value); setPeriodo('custom'); }}
            className="glass-input !w-auto !py-1 sm:!py-1.5 text-[10px] sm:text-xs"
          />
          <span className="text-secondary text-[10px] sm:text-xs">até</span>
          <input
            type="date"
            value={end}
            onChange={(e) => { setEnd(e.target.value); setPeriodo('custom'); }}
            className="glass-input !w-auto !py-1 sm:!py-1.5 text-[10px] sm:text-xs"
          />
          <div className="flex gap-1.5 ml-auto">
            <button onClick={exportCSV} className="glass-button flex items-center gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" /> CSV
            </button>
            <button onClick={() => window.print()} className="glass-button flex items-center gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5">
              <Printer className="w-3 h-3 sm:w-4 sm:h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-0.5 rounded-xl glass-card !p-0.5 sm:!p-1 w-full sm:w-fit no-print overflow-x-auto">
        {(['resumo', 'categorias', 'evolucao', 'top'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg transition-all whitespace-nowrap',
              tab === t ? 'bg-blue-500/20 text-primary' : 'text-secondary'
            )}
          >
            {t === 'top' ? 'Top gastos' : t === 'evolucao' ? 'Evolução' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="glass-card p-8 sm:p-12 text-center text-secondary text-sm">Carregando...</div>
      ) : (
        <>
          {/* Resumo */}
          {tab === 'resumo' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <KpiBox label="Entradas" value={data.resumo.entradas} color="#34d399" />
                <KpiBox label="Saídas" value={data.resumo.saidas} color="#fb7185" />
                <KpiBox label="Saldo" value={data.resumo.saldo} color={data.resumo.saldo >= 0 ? '#34d399' : '#fb7185'} />
                <KpiBox label="Investido" value={data.resumo.totalInvestido} color="#a5b4fc" />
              </div>

              <GlassCard className="!p-3 sm:!p-5">
                <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Por mês no período</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.porMes} margin={{ left: -15, right: 5, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="mes" stroke="rgba(148,163,184,0.7)" fontSize={10} tickMargin={4} />
                    <YAxis stroke="rgba(148,163,184,0.7)" fontSize={10} tickFormatter={(v) => formatBRLCompact(v)} width={50} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                    <Bar dataKey="entradas" name="Entradas" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          )}

          {/* Categorias */}
          {tab === 'categorias' && (
            <GlassCard className="!p-3 sm:!p-5">
              <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Gastos por categoria</h3>
              <div className="space-y-2.5 sm:space-y-3">
                {data.porCategoria
                  .filter((c: any) => c.tipo === 'saida')
                  .map((c: any) => {
                    const max = Math.max(...data.porCategoria.filter((x: any) => x.tipo === 'saida').map((x: any) => x.valor));
                    const pct = (c.valor / max) * 100;
                    return (
                      <div key={c.nome}>
                        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                          <span className="text-xs sm:text-sm text-primary font-medium truncate mr-2">{c.nome}</span>
                          <span className="text-[10px] sm:text-xs text-secondary tabular shrink-0">
                            <HiddenValue value={c.valor} />
                          </span>
                        </div>
                        <div className="w-full h-2.5 sm:h-3 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: c.cor }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </GlassCard>
          )}

          {/* Evolução */}
          {tab === 'evolucao' && (
            <GlassCard className="!p-3 sm:!p-5">
              <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Linha temporal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.porMes} margin={{ left: -15, right: 5, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="mes" stroke="rgba(148,163,184,0.7)" fontSize={10} tickMargin={4} />
                  <YAxis stroke="rgba(148,163,184,0.7)" fontSize={10} tickFormatter={(v) => formatBRLCompact(v)} width={50} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#fb7185" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Top */}
          {tab === 'top' && (
            <GlassCard className="!p-0 overflow-hidden">
              <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/10">
                <h3 className="text-primary text-sm sm:text-base">Top 10 maiores gastos</h3>
              </div>

              {/* Mobile: card list */}
              <div className="sm:hidden divide-y divide-white/5">
                {data.topGastos.map((l: any, i: number) => (
                  <div key={l.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-tertiary font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-primary font-medium truncate">{l.descricao}</div>
                      <div className="text-[10px] text-tertiary">{formatDate(l.data)} · {l.categoria.nome}</div>
                    </div>
                    <div className="text-sm text-rose-400 font-semibold tabular shrink-0">
                      <HiddenValue value={l.valor} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-secondary uppercase">
                      <th className="text-left px-5 py-3">#</th>
                      <th className="text-left px-5 py-3">Descrição</th>
                      <th className="text-left px-5 py-3">Categoria</th>
                      <th className="text-left px-5 py-3">Data</th>
                      <th className="text-right px-5 py-3">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topGastos.map((l: any, i: number) => (
                      <tr key={l.id} className="border-b border-white/5">
                        <td className="px-5 py-3 text-secondary text-xs">{i + 1}</td>
                        <td className="px-5 py-3 text-primary font-medium truncate max-w-[200px]">{l.descricao}</td>
                        <td className="px-5 py-3"><Badge color={l.categoria.cor}>{l.categoria.nome}</Badge></td>
                        <td className="px-5 py-3 text-secondary text-xs tabular">{formatDate(l.data)}</td>
                        <td className="px-5 py-3 text-right text-rose-400 font-semibold tabular"><HiddenValue value={l.valor} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

function KpiBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-3 sm:p-4">
      <div className="text-[10px] sm:text-xs text-secondary uppercase font-medium">{label}</div>
      <div className="text-lg sm:text-2xl font-bold tabular mt-0.5 sm:mt-1 truncate" style={{ color }}>
        <HiddenValue value={value} />
      </div>
    </div>
  );
}
