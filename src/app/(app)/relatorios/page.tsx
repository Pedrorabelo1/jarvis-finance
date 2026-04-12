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
    <div className="space-y-4">
      {/* Filtros */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-secondary" />
          <span className="text-xs text-secondary uppercase font-medium">Período</span>
        </div>
        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {(['mes', 'trimestre', 'semestre', 'ano', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => applyPeriodo(p)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                periodo === p ? 'bg-blue-500/20 text-primary' : 'text-secondary'
              )}
            >
              {p === 'mes' ? 'Mês' : p === 'custom' ? 'Personalizado' : p}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
            setPeriodo('custom');
          }}
          className="glass-input !w-auto !py-1.5 text-xs"
        />
        <span className="text-secondary text-xs">até</span>
        <input
          type="date"
          value={end}
          onChange={(e) => {
            setEnd(e.target.value);
            setPeriodo('custom');
          }}
          className="glass-input !w-auto !py-1.5 text-xs"
        />

        <div className="ml-auto flex gap-2">
          <button onClick={exportCSV} className="glass-button flex items-center gap-2 text-xs">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => window.print()}
            className="glass-button flex items-center gap-2 text-xs"
          >
            <Printer className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl glass-card !p-1 w-fit no-print">
        {(['resumo', 'categorias', 'evolucao', 'top'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all',
              tab === t ? 'bg-blue-500/20 text-primary' : 'text-secondary'
            )}
          >
            {t === 'top' ? 'Top gastos' : t}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="glass-card p-12 text-center text-secondary">Carregando...</div>
      ) : (
        <>
          {/* Resumo */}
          {tab === 'resumo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiBox label="Entradas" value={data.resumo.entradas} color="#34d399" />
                <KpiBox label="Saídas" value={data.resumo.saidas} color="#fb7185" />
                <KpiBox
                  label="Saldo"
                  value={data.resumo.saldo}
                  color={data.resumo.saldo >= 0 ? '#34d399' : '#fb7185'}
                />
                <KpiBox label="Investido" value={data.resumo.totalInvestido} color="#a5b4fc" />
              </div>

              <GlassCard>
                <h3 className="text-primary mb-4">Por mês no período</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.porMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="mes" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                    <YAxis
                      stroke="rgba(148,163,184,0.7)"
                      fontSize={11}
                      tickFormatter={(v) => formatBRLCompact(v)}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                    <Bar dataKey="entradas" name="Entradas" fill="#34d399" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="#fb7185" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          )}

          {/* Categorias */}
          {tab === 'categorias' && (
            <GlassCard>
              <h3 className="text-primary mb-4">Gastos por categoria</h3>
              <div className="space-y-3">
                {data.porCategoria
                  .filter((c: any) => c.tipo === 'saida')
                  .map((c: any) => {
                    const max = Math.max(...data.porCategoria.filter((x: any) => x.tipo === 'saida').map((x: any) => x.valor));
                    const pct = (c.valor / max) * 100;
                    return (
                      <div key={c.nome}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-primary font-medium">{c.nome}</span>
                          <span className="text-xs text-secondary tabular">
                            <HiddenValue value={c.valor} />
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
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
            <GlassCard>
              <h3 className="text-primary mb-4">Linha temporal</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.porMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="mes" stroke="rgba(148,163,184,0.7)" fontSize={11} />
                  <YAxis
                    stroke="rgba(148,163,184,0.7)"
                    fontSize={11}
                    tickFormatter={(v) => formatBRLCompact(v)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                  <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#fb7185" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}

          {/* Top */}
          {tab === 'top' && (
            <GlassCard className="!p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10">
                <h3 className="text-primary">Top 10 maiores gastos</h3>
              </div>
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
                      <td className="px-5 py-3 text-primary font-medium">{l.descricao}</td>
                      <td className="px-5 py-3">
                        <Badge color={l.categoria.cor}>{l.categoria.nome}</Badge>
                      </td>
                      <td className="px-5 py-3 text-secondary text-xs tabular">{formatDate(l.data)}</td>
                      <td className="px-5 py-3 text-right text-rose-400 font-semibold tabular">
                        <HiddenValue value={l.valor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

function KpiBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-4">
      <div className="text-xs text-secondary uppercase font-medium">{label}</div>
      <div className="text-2xl font-bold tabular mt-1" style={{ color }}>
        <HiddenValue value={value} />
      </div>
    </div>
  );
}
