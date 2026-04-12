import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const { searchParams } = request.nextUrl;
    const start = new Date(searchParams.get('start') || new Date().toISOString());
    const end = new Date(searchParams.get('end') || new Date().toISOString());

    const lancamentos = await prisma.lancamento.findMany({
      where: { userId, data: { gte: start, lt: end } },
      include: { categoria: true },
      orderBy: { data: 'asc' },
    });

    const investimentos = await prisma.investimento.findMany({
      where: { userId, data: { gte: start, lt: end } },
      orderBy: { data: 'asc' },
    });

    const entradas = lancamentos.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
    const saidas = lancamentos.filter((l) => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);

    const porMes = new Map<string, { mes: string; entradas: number; saidas: number }>();
    for (const l of lancamentos) {
      const d = new Date(l.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const cur = porMes.get(key) || { mes: label, entradas: 0, saidas: 0 };
      if (l.tipo === 'entrada') cur.entradas += l.valor;
      else cur.saidas += l.valor;
      porMes.set(key, cur);
    }

    const porCategoria = new Map<string, { nome: string; cor: string; valor: number; tipo: string }>();
    for (const l of lancamentos) {
      const key = l.categoriaId;
      const cur = porCategoria.get(key) || {
        nome: l.categoria.nome,
        cor: l.categoria.cor,
        valor: 0,
        tipo: l.tipo,
      };
      cur.valor += l.valor;
      porCategoria.set(key, cur);
    }

    const topGastos = lancamentos
      .filter((l) => l.tipo === 'saida')
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    return {
      data: {
        resumo: {
          entradas,
          saidas,
          saldo: entradas - saidas,
          totalLancamentos: lancamentos.length,
          totalInvestido: investimentos.reduce((s, i) => s + i.valor, 0),
        },
        porMes: Array.from(porMes.values()),
        porCategoria: Array.from(porCategoria.values()).sort((a, b) => b.valor - a.valor),
        topGastos,
        lancamentos,
      },
    };
  });
}
