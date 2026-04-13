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
 * Radial bar chart — bars arranged in a circle radiating outward,
 * inspired by circular sunburst / radial bar visualizations.
 */
export function RadialChart({ data, size = 220, className = '' }: RadialChartProps) {
  const chart = useMemo(() => {
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) => b.valor - a.valor);
    const maxVal = sorted[0]?.valor || 1;
    const count = sorted.length;

    const cx = size / 2;
    const cy = size / 2;
    const innerR = size * 0.2;
    const maxOuterR = size * 0.46;
    const barGap = 1.5; // degrees gap between bars
    const totalGap = barGap * count;
    const availableDeg = 360 - totalGap;
    const barAngle = availableDeg / count;

    const bars = sorted.map((item, i) => {
      const startAngle = i * (barAngle + barGap) - 90; // start from top
      const endAngle = startAngle + barAngle;
      const ratio = item.valor / maxVal;
      const outerR = innerR + (maxOuterR - innerR) * ratio;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + innerR * Math.cos(startRad);
      const y1 = cy + innerR * Math.sin(startRad);
      const x2 = cx + outerR * Math.cos(startRad);
      const y2 = cy + outerR * Math.sin(startRad);
      const x3 = cx + outerR * Math.cos(endRad);
      const y3 = cy + outerR * Math.sin(endRad);
      const x4 = cx + innerR * Math.cos(endRad);
      const y4 = cy + innerR * Math.sin(endRad);

      const largeArc = barAngle > 180 ? 1 : 0;

      const d = [
        `M ${x1} ${y1}`,
        `L ${x2} ${y2}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3}`,
        `L ${x4} ${y4}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1}`,
        'Z',
      ].join(' ');

      return (
        <path
          key={item.nome}
          d={d}
          fill={item.cor}
          opacity={0.85}
          className="transition-opacity duration-200 hover:opacity-100"
        >
          <title>{`${item.nome}: R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</title>
        </path>
      );
    });

    return bars;
  }, [data, size]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: size }}>
        <p className="text-tertiary text-sm">Sem dados</p>
      </div>
    );
  }

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
          r={size * 0.18}
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(96,165,250,0.1)"
          strokeWidth="1"
        />
        {chart}
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
          {`R$ ${data.reduce((s, d) => s + d.valor, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
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
