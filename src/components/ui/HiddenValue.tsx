'use client';

import { useFinanceStore } from '@/store/useFinanceStore';
import { formatBRL } from '@/lib/formatters';

interface HiddenValueProps {
  value: number;
  className?: string;
  showSign?: boolean;
}

export function HiddenValue({ value, className, showSign }: HiddenValueProps) {
  const hide = useFinanceStore((s) => s.hideValues);
  if (hide) {
    return <span className={className}>R$ ••••</span>;
  }
  const formatted = formatBRL(Math.abs(value));
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';
  return <span className={`tabular ${className || ''}`}>{sign}{formatted}</span>;
}
