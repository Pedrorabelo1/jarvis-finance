'use client';

import { formatBRL } from '@/lib/formatters';

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card-strong p-3 !rounded-xl text-xs min-w-[140px]">
      {label && <div className="font-medium text-primary mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-secondary">{p.name}</span>
          </div>
          <span className="text-primary font-medium tabular">{formatBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
