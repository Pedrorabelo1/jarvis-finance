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
 * Radial bar chart — uniform-length thin bars arranged around a full circle.
 * Each category occupies a proportional arc; bars are same height, color-coded.
 */
export function RadialChart({ data, size = 220, className = '' }: RadialChartProps) {
  const totalBars = 72; // total sticks around the circle

  const bars = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => b.valor - a.valor);
    const total = sorted.reduce((s, d) => s + d.valor, 0);
    if (total === 0) return [];

    // Assign bars proportionally, sum must equal totalBars
    const assignments: { cor: string; nome: string }[] = [];
    let remaining = totalBars;

    sorted.forEach((item, idx) => {
      const isLast = idx === sorted.length - 1;
      const count = isLast
        ? remaining
        : Math.max(1, Math.round((item.valor / total) * totalBars));
      const actual = Math.min(count, remaining);
      remaining -= actual;
      for (let i = 0; i < actual; i++) {
        assignments.push({ cor: item.cor, nome: item.nome });
      }
    });

    const cx = size / 2;
    const cy = size / 2;
    const innerR = size * 0.24;   // inner ring radius
    const barLen = size * 0.22;   // ALL bars same length
    const barWidth = Math.max(2, (size / totalBars) * 1.8);
    const anglePerBar = 360 / assignments.length;

    return assignments.map((bar, i) => {
      const angleDeg = i * anglePerBar - 90; // start from top
      const angleRad = (angleDeg * Math.PI) / 180;

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
          opacity={0.92}
        >
          <title>{bar.nome}</title>
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
        {/* Inner circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.22}
          fill="rgba(10,15,30,0.85)"
          stroke="rgba(96,165,250,0.15)"
          strokeWidth="1"
        />

        {bars}

        {/* Center label */}
        <text
          x={size / 2}
          y={size / 2 - 7}
          textAnchor="middle"
          fill="rgba(148,163,184,0.8)"
          fontSize={size * 0.045}
          fontWeight="500"
        >
          Total
        </text>
        <text
          x={size / 2}
          y={size / 2 + 9}
          textAnchor="middle"
          fill="white"
          fontSize={size * 0.058}
          fontWeight="700"
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
