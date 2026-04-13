'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Target,
  Activity,
  PiggyBank,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { useFinanceStore } from '@/store/useFinanceStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { RadialChart } from '@/components/charts/RadialChart';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HiddenValue } from '@/components/ui/HiddenValue';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { Badge } from '@/components/ui/Badge';
import { formatBRL, formatBRLCompact } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface DashboardData {
  kpis: {
    entradas: number;
    saidas: number;
    saldo: number;
    patrimonio: number;
    entradasPrev: number;
    saidasPrev: number;
    saldoPrev: number;
    patrimonioPrev: number;
  };
  last6: { mes: string; entradas: number; saidas: number }[];
  gastosPorCategoria: { nome: string; cor: string; valor: number }[];
  evolucao12: { mes: string; valor: number }[];
  orcamento: {
    id: string;
    nome: string;
    cor: string;
    icone: string;
    orcamento: number;
    realizado: number;
    percentual: number;
  }[];
  fixasUpcoming: {
    id: string;
    descricao: string;
    valor: number;
    diaVencimento: number;
    diasRestantes: number;
    categoria: { cor: string; icone: string; nome: string };
  }[];
  indicadores: {
    indicePoupanca: number;
    fluxoProjetado: number;
    metaMensal: number;
    progressoMeta: number;
  };
}

function variation(curr: number, prev: number): { value: number; positive: boolean } {
  if (prev === 0) return { value: 0, positive: curr >= 0 };
  const v = ((curr - prev) / Math.abs(prev)) * 100;
  return { value: Math.round(v * 10) / 10, positive: v >= 0 };
}

export default function DashboardPage() {
  const { selectedYear, selectedMonth } = useFinanceStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?year=${selectedYear}&month=${selectedMonth}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data);
        setLoading(false);
      });
  }, [selectedYear, selectedMonth]);

  if (loading || !data) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-4 sm:p-5 h-28 sm:h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card p-4 sm:p-5 h-64 sm:h-80 lg:col-span-2 animate-pulse" />
          <div className="glass-card p-4 sm:p-5 h-64 sm:h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  const k = data.kpis;
  const varEntradas = variation(k.entradas, k.entradasPrev);
  const varSaidas = variation(k.saidas, k.saidasPrev);
  const varSaldo = variation(k.saldo, k.saldoPrev);
  const varPatrim = variation(k.patrimonio, k.patrimonioPrev);

  const KPI = ({
    icon: Icon,
    label,
    value,
    color,
    variation,
    invertColor,
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 sm:p-5"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}25`, color }}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        {variation && variation.value !== 0 && (
          <Badge color={invertColor ? (variation.positive ? '#fb7185' : '#34d399') : variation.positive ? '#34d399' : '#fb7185'}>
            {variation.positive ? '+' : ''}
            {variation.value}%
          </Badge>
        )}
      </div>
      <div className="text-[10px] sm:text-xs text-secondary uppercase tracking-wide font-medium">{label}</div>
      <div className="text-lg sm:text-[28px] font-bold text-primary tabular leading-tight mt-0.5 sm:mt-1 truncate">
        <HiddenValue value={value} />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <KPI
          icon={TrendingUp}
          label="Entradas"
          value={k.entradas}
          color="#34d399"
          variation={varEntradas}
        />
        <KPI
          icon={TrendingDown}
          label="Saídas"
          value={k.saidas}
          color="#fb7185"
          variation={varSaidas}
          invertColor
        />
        <KPI
          icon={Wallet}
          label="Saldo"
          value={k.saldo}
          color={k.saldo >= 0 ? '#34d399' : '#fb7185'}
          variation={varSaldo}
        />
        <KPI
          icon={BarChart3}
          label="Investido"
          value={k.patrimonio}
          color="#a5b4fc"
          variation={varPatrim}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="lg:col-span-2 !p-3 sm:!p-5">
          <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Entradas vs Saídas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.last6} margin={{ left: -15, right: 5, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="mes" stroke="rgba(148,163,184,0.7)" fontSize={10} tickMargin={4} />
              <YAxis
                stroke="rgba(148,163,184,0.7)"
                fontSize={10}
                tickFormatter={(v) => formatBRLCompact(v)}
                width={50}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="entradas" name="Entradas" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="!p-3 sm:!p-5">
          <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Gastos por categoria</h3>
          {data.gastosPorCategoria.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-secondary text-sm">
              Sem gastos no período
            </div>
          ) : (
            <RadialChart data={data.gastosPorCategoria} size={190} />
          )}
        </GlassCard>
      </div>

      {/* Patrimônio evolution */}
      <GlassCard className="!p-3 sm:!p-5">
        <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Evolução do patrimônio (12 meses)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.evolucao12} margin={{ left: -15, right: 5, top: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="mes" stroke="rgba(148,163,184,0.7)" fontSize={10} tickMargin={4} />
            <YAxis
              stroke="rgba(148,163,184,0.7)"
              fontSize={10}
              tickFormatter={(v) => formatBRLCompact(v)}
              width={50}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="valor" name="Patrimônio" stroke="#a5b4fc" fill="url(#patGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Cards info row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <GlassCard className="!p-3 sm:!p-5">
          <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Orçamento vs Realizado</h3>
          {data.orcamento.length === 0 ? (
            <p className="text-sm text-secondary">Defina orçamentos nas categorias para ver aqui.</p>
          ) : (
            <div className="space-y-2.5 sm:space-y-3 max-h-64 sm:max-h-72 overflow-y-auto pr-1 sm:pr-2">
              {data.orcamento.map((o) => (
                <div key={o.id}>
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                      <div
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${o.cor}25`, color: o.cor }}
                      >
                        <IconRenderer name={o.icone} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm text-primary font-medium truncate">{o.nome}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs tabular text-secondary shrink-0 ml-2">
                      <HiddenValue value={o.realizado} /> / <HiddenValue value={o.orcamento} />
                    </span>
                  </div>
                  <ProgressBar value={o.percentual} />
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="!p-3 sm:!p-5">
          <h3 className="text-primary text-sm sm:text-base mb-3 sm:mb-4">Próximas despesas fixas</h3>
          {data.fixasUpcoming.length === 0 ? (
            <p className="text-sm text-secondary">Sem despesas fixas ativas.</p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1 sm:pr-2">
              {data.fixasUpcoming.slice(0, 8).map((f) => (
                <div key={f.id} className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-white/5">
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${f.categoria.cor}25`, color: f.categoria.cor }}
                  >
                    <IconRenderer name={f.categoria.icone} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm text-primary font-medium truncate">{f.descricao}</div>
                    <div className="text-[10px] sm:text-xs text-secondary">Dia {f.diaVencimento}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm tabular text-primary font-medium">
                      <HiddenValue value={f.valor} />
                    </div>
                    {f.diasRestantes >= 0 && (
                      <Badge color={f.diasRestantes <= 3 ? '#fb7185' : f.diasRestantes <= 7 ? '#f59e0b' : '#34d399'}>
                        {f.diasRestantes === 0 ? 'Hoje' : `${f.diasRestantes}d`}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="!p-3 sm:!p-5">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <PiggyBank className="w-4 h-4 text-emerald-400" />
            <h3 className="text-primary !text-sm sm:!text-base">Índice de Poupança</h3>
          </div>
          <div className="flex items-center justify-center my-1 sm:my-2">
            <CircularGauge value={data.indicadores.indicePoupanca} />
          </div>
          <p className="text-[10px] sm:text-xs text-secondary text-center">
            do que entra, sobra para você
          </p>
        </GlassCard>

        <GlassCard className="!p-3 sm:!p-5">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-primary !text-sm sm:!text-base">Fluxo Projetado</h3>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular my-3 sm:my-4 text-center">
            <span className={data.indicadores.fluxoProjetado >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              <HiddenValue value={data.indicadores.fluxoProjetado} />
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-secondary text-center">saldo após fixas pendentes</p>
        </GlassCard>

        <GlassCard className="!p-3 sm:!p-5">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Target className="w-4 h-4 text-indigo-300" />
            <h3 className="text-primary !text-sm sm:!text-base">Meta do Mês</h3>
          </div>
          {data.indicadores.metaMensal > 0 ? (
            <>
              <div className="text-xl sm:text-2xl font-bold text-primary tabular text-center mt-2 sm:mt-3 mb-1.5 sm:mb-2">
                <HiddenValue value={k.saldo} /> /{' '}
                <span className="text-secondary text-sm sm:text-base">
                  <HiddenValue value={data.indicadores.metaMensal} />
                </span>
              </div>
              <ProgressBar
                value={data.indicadores.progressoMeta}
                color={data.indicadores.progressoMeta >= 100 ? '#34d399' : '#a5b4fc'}
              />
              <p className="text-[10px] sm:text-xs text-secondary text-center mt-1.5 sm:mt-2">
                {Math.round(data.indicadores.progressoMeta)}% da meta
              </p>
            </>
          ) : (
            <p className="text-sm text-secondary text-center mt-4">Configure uma meta mensal</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function CircularGauge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (v / 100) * circ;
  const color = v >= 30 ? '#34d399' : v >= 15 ? '#f59e0b' : '#fb7185';
  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32">
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl sm:text-2xl font-bold text-primary tabular">{v.toFixed(0)}%</div>
      </div>
    </div>
  );
}
