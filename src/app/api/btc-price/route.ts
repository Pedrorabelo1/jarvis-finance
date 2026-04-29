import { NextResponse } from 'next/server';

let cached: { price: number; timestamp: number } | null = null;
const TTL = 5 * 60 * 1000;

export async function GET() {
  if (cached && Date.now() - cached.timestamp < TTL) {
    return NextResponse.json({ price: cached.price, cached: true });
  }
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl',
      { cache: 'no-store' }
    );
    const data = await res.json();
    const price: number = data?.bitcoin?.brl;
    if (!price) throw new Error('no price');
    cached = { price, timestamp: Date.now() };
    return NextResponse.json({ price, cached: false });
  } catch {
    if (cached) return NextResponse.json({ price: cached.price, cached: true, stale: true });
    return NextResponse.json({ error: 'Falha ao buscar preço' }, { status: 503 });
  }
}
