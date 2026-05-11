import { NextResponse } from 'next/server';

interface CachedData {
  priceUSD: number;
  priceBRL: number;
  usdBrlRate: number;
  timestamp: number;
}

let cached: CachedData | null = null;
const TTL = 5 * 60 * 1000; // 5 min

export async function GET() {
  if (cached && Date.now() - cached.timestamp < TTL) {
    return NextResponse.json({ ...cached, cached: true });
  }
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl',
      { cache: 'no-store' }
    );
    const data = await res.json();
    const priceUSD: number = data?.bitcoin?.usd;
    const priceBRL: number = data?.bitcoin?.brl;
    if (!priceUSD || !priceBRL) throw new Error('no price');

    const usdBrlRate = priceBRL / priceUSD; // cotação USD→BRL derivada do BTC
    cached = { priceUSD, priceBRL, usdBrlRate, timestamp: Date.now() };
    return NextResponse.json({ priceUSD, priceBRL, usdBrlRate, cached: false });
  } catch {
    if (cached) return NextResponse.json({ ...cached, cached: true, stale: true });
    return NextResponse.json({ error: 'Falha ao buscar preço' }, { status: 503 });
  }
}
