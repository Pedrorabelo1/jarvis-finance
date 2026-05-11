'use client';

import { useFinanceStore } from '@/store/useFinanceStore';
import { formatBRL } from '@/lib/formatters';

interface HiddenValueProps {
  value: number;
  className?: string;
  showSign?: boolean;
  /** Custom formatter — defaults to formatBRL */
  formatter?: (v: number) => string;
  /** Symbol shown when values are hidden — defaults to 'R$' */
  hiddenSymbol?: string;
}

export function HiddenValue({
  value,
  className,
  showSign,
  formatter = formatBRL,
  hiddenSymbol,
}: HiddenValueProps) {
  const hide = useFinanceStore((s) => s.hideValues);

  if (hide) {
    // Detect currency symbol from first char of a formatted zero
    const symbol = hiddenSymbol ?? (formatter(0).startsWith('$') ? '$' : 'R$');
    return <span className={className}>{symbol} ••••</span>;
  }

  const formatted = formatter(Math.abs(value));
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';
  return <span className={`tabular ${className || ''}`}>{sign}{formatted}</span>;
}
