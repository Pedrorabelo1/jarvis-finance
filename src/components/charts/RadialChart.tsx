'use client';

import { useMemo } from 'react';

interface RadialItem {
  nome: string;
  cor: string;
  valor: number;
}

interface RadialChartProps {
  data: RadialItem[];
  size?: number;
  className?: string;
}

/**
 * Radial bar chart — thin individual bars (sticks) arranged around a circle,
 * each bar's length proportional to its value. Matches the "circular barcode"
 * sunburst reference style.
 */
export function RadialChart({ data, size = 220, className = '' }: RadialChartProps) {
  const totalBars = 60; // total number of thin bars around the circle

  const bars = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => b.valor - a.valor);
    const total = sorted.reduce((s, d) => s + d.valor, 0);
    if (total === 0) return [];

    // Distribute bars proportionally to each category's value
    const barAssignments: { cor: string; nome: string; valor: number; ratio: number }[] = [];
    let remaining = totalBars;

    sorted.forEach((item, idx) => {
      const proportion = item.valor / total;
      const count = idx === sorted.length - 1
        ? remaining
        : Math.max(1, Math.round(proportion * totalBars));
      remaining -= count;
      if (remaining < 0) remaining = 0;

      // Each bar in this category gets the same height ratio
      const maxVal = sorted[0].valor;
      const ratio = 0.35 + (item.valor / maxVal) * 0.65; // min 35% height, max 100%

      for (let i = 0; i < count; i++) {
        barAssignments.push({ cor: item.cor, nome: item.nome, valor: item.valor, ratio });
      }
    });

    const cx = size / 2;
    const cy = size / 2;
    const innerR = size * 0.22;
    const maxBarLen = size * 0.24;
    const barWidth = 3;
    const gap = 1.2; // degrees gap between bars
    const totalAngle = 360;
    const anglePerBar = totalAngle / barAssignments.length;

    return barAssignments.map((bar, i) => {
      const angleDeg = i * anglePerBar - 90; // start from top
      const angleRad = (angleDeg * Math.PI) / 180;
      const barLen = maxBarLen * bar.ratio;

      const x1 = cx + innerR * Math.cos(angleRad);
      const y1 = cy + innerR * Math.sin(angleRad);
      const x2 = cx + (innerR + barLen) * Math.cos(angleRad);
      const y2 = cy + (innerR + barLen) * Math.sin(angleRad);

      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={bar.cor}
          strokeWidth={barWidth}
          strokeLinecap="round"
          opacity={0.9}
          className="transition-opacity duration-200 hover:opacity-100"
        >
          <title>{`${bar.nome}: R$ ${bar.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</title>
        </line>
      );
    });
  }, [data, size]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: size }}>
        <p className="text-tertiary text-sm">Sem dados</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.valor, 0);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        {/* Inner circle background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.2}
          fill="rgba(10,15,30,0.8)"
          stroke="rgba(96,165,250,0.12)"
          strokeWidth="1.5"
        />

        {/* Bars */}
        {bars}

        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          className="fill-current text-secondary"
          fontSize={size * 0.045}
          fontWeight="500"
        >
          Total
        </text>
        <text
          x={size / 2}
          y={size / 2 + 10}
          textAnchor="middle"
          className="fill-current text-primary"
          fontSize={size * 0.055}
          fontWeight="600"
        >
          {`R$ ${total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
        </text>
      </svg>

      {/* Legend */}
      <div className="w-full mt-3 max-h-28 overflow-y-auto grid grid-cols-2 gap-x-3 gap-y-1 px-1">
        {[...data].sort((a, b) => b.valor - a.valor).map((item) => (
          <div key={item.nome} className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.cor }}
            />
            <span className="text-[11px] text-secondary truncate">{item.nome}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
