const TZ = 'America/Sao_Paulo';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatBRLCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}k`;
  }
  return formatBRL(value);
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...opts,
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    month: 'short',
  }).format(d);
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const s = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    month: 'long',
    year: 'numeric',
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function parseBRLInput(input: string): number {
  if (!input) return 0;
  // Accept "1.234,56" or "1234.56" or "1234,56"
  const cleaned = input
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // remove thousands sep
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  // month is 0-indexed
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return getMonthRange(now.getFullYear(), now.getMonth());
}

export function daysUntil(day: number, fromDate: Date = new Date()): number {
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);
  const target = new Date(today.getFullYear(), today.getMonth(), day);
  if (target < today) {
    target.setMonth(target.getMonth() + 1);
  }
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
