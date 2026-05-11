import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

/** Project a recurring lancamento into a given year/month. */
function projectar(l: any, year: number, month: number) {
  const origDay = new Date(l.data).getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return { ...l, data: new Date(year, month, Math.min(origDay, lastDay)) };
}

/** Get all lancamentos for a month, including projected recurring entries from prior months. */
async function getLancamentosMes(userId: string, start: Date, end: Date) {
  const year  = start.getFullYear();
  const month = start.getMonth();

  const [normais, recorrentes] = await Promise.all([
    prisma.lancamento.findMany({
      where: { userId, data: { gte: start, lt: end } },
      include: { categoria: true },
    }),
    prisma.lancamento.findMany({
      where: { userId, recorrente: true, data: { lt: start } },
      include: { categoria: true },
    }),
  ]);

  const projetados = recorrentes.map(r => projectar(r, year, month));
  return [...normais, ...projetados];
}

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const { searchParams } = request.nextUrl;
    const year  = parseInt(searchParams.get('year')  || `${new Date().getFullYear()}`, 10);
    const month = parseInt(searchParams.get('month') || `${new Date().getMonth()}`, 10);

    const start     = new Date(year, month, 1);
    const end       = new Date(year, month + 1, 1);
    const prevStart = new Date(year, month - 1, 1);
    const prevEnd   = new Date(year, month, 1);

    // Lançamentos do mês (normais + projetados recorrentes)
    const lancamentosMes  = await getLancamentosMes(userId, start, end);
    const lancamentosPrev = await getLancamentosMes(userId, prevStart, prevEnd);

    const entradas = lancamentosMes.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
    const saidas   = lancamentosMes.filter(l => l.tipo === 'saida')  .reduce((s, l) => s + l.valor, 0);
    const saldo    = entradas - saidas;

    const entradasPrev = lancamentosPrev.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
    const saidasPrev   = lancamentosPrev.filter(l => l.tipo === 'saida')  .reduce((s, l) => s + l.valor, 0);
    const saldoPrev    = entradasPrev - saidasPrev;

    // Patrimônio investido
    const investAtéMes  = await prisma.investimento.findMany({ where: { userId, data: { lt: end } } });
    const patrimonio    = investAtéMes.reduce((s, i) => s + i.valor, 0);
    const investAtéPrev = await prisma.investimento.findMany({ where: { userId, data: { lt: prevEnd } } });
    const patrimonioPrev = investAtéPrev.reduce((s, i) => s + i.valor, 0);

    // Últimos 6 meses (com recorrentes projetados)
    const last6: { mes: string; entradas: number; saidas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const s = new Date(year, month - i, 1);
      const e = new Date(year, month - i + 1, 1);
      const ls = await getLancamentosMes(userId, s, e);
      last6.push({
        mes:     s.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        entradas: ls.filter(l => l.tipo === 'entrada').reduce((a, l) => a + l.valor, 0),
        saidas:   ls.filter(l => l.tipo === 'saida')  .reduce((a, l) => a + l.valor, 0),
      });
    }

    // Gastos por categoria
    const porCategoria = new Map<string, { nome: string; cor: string; valor: number }>();
    for (const l of lancamentosMes.filter(x => x.tipo === 'saida')) {
      const key = l.categoriaId;
      const ex  = porCategoria.get(key);
      if (ex) { ex.valor += l.valor; }
      else {
        porCategoria.set(key, { nome: l.categoria.nome, cor: l.categoria.cor, valor: l.valor });
      }
    }
    const gastosPorCategoria = Array.from(porCategoria.values()).sort((a, b) => b.valor - a.valor);

    // Evolução patrimônio 12 meses
    const evolucao12: { mes: string; valor: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const e = new Date(year, month - i + 1, 1);
      const accumulated = await prisma.investimento.findMany({ where: { userId, data: { lt: e } } });
      evolucao12.push({
        mes:   new Date(year, month - i, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        valor: accumulated.reduce((s, x) => s + x.valor, 0),
      });
    }

    // Orçamento vs realizado
    const categorias = await prisma.categoria.findMany({ where: { userId, tipo: 'saida' } });
    const orcamento  = categorias
      .filter(c => c.orcamento && c.orcamento > 0)
      .map(c => {
        const realizado = lancamentosMes.filter(l => l.categoriaId === c.id).reduce((s, l) => s + l.valor, 0);
        return {
          id: c.id, nome: c.nome, cor: c.cor, icone: c.icone,
          orcamento: c.orcamento!, realizado,
          percentual: (realizado / c.orcamento!) * 100,
        };
      })
      .sort((a, b) => b.percentual - a.percentual);

    // Próximas fixas (DespesaFixa)
    const fixas = await prisma.despesaFixa.findMany({
      where: { userId, status: 'ativa' },
      include: { categoria: true },
      orderBy: { diaVencimento: 'asc' },
    });
    const today = new Date();
    const fixasUpcoming = fixas.map(f => {
      const target = new Date(year, month, f.diaVencimento);
      const isCurMonth = today.getFullYear() === year && today.getMonth() === month;
      const diasRestantes = isCurMonth
        ? Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : f.diaVencimento - today.getDate();
      return { id: f.id, descricao: f.descricao, valor: f.valor, diaVencimento: f.diaVencimento, categoria: f.categoria, diasRestantes };
    }).sort((a, b) => a.diaVencimento - b.diaVencimento);

    // Lançamentos recorrentes — totais fixos
    const todosRecorrentes = await prisma.lancamento.findMany({
      where: { userId, recorrente: true },
    });
    const totalFixoSaidas   = todosRecorrentes.filter(l => l.tipo === 'saida')  .reduce((s, l) => s + l.valor, 0);
    const totalFixoEntradas = todosRecorrentes.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);

    // Meta e indicadores
    const meta       = await prisma.configuracao.findFirst({ where: { userId, chave: 'meta_mensal' } });
    const metaMensal = meta ? parseFloat(meta.valor) : 0;
    const indicePoupanca = entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0;
    const fixasPendentes = fixasUpcoming.filter(f => f.diasRestantes >= 0).reduce((s, f) => s + f.valor, 0);
    const fluxoProjetado = saldo - fixasPendentes;

    return {
      data: {
        kpis: { entradas, saidas, saldo, patrimonio, entradasPrev, saidasPrev, saldoPrev, patrimonioPrev },
        last6,
        gastosPorCategoria,
        evolucao12,
        orcamento,
        fixasUpcoming,
        fixosRecorrentes: { saidas: totalFixoSaidas, entradas: totalFixoEntradas },
        indicadores: {
          indicePoupanca, fluxoProjetado, metaMensal,
          progressoMeta: metaMensal > 0 ? (saldo / metaMensal) * 100 : 0,
        },
      },
    };
  });
}
