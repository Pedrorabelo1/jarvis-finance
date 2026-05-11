import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const createSchema = z.object({
  descricao:   z.string().min(1),
  valor:       z.number().positive(),
  tipo:        z.enum(['entrada', 'saida']),
  data:        z.string().or(z.date()),
  categoriaId: z.string().min(1),
  tags:        z.string().nullable().optional(),
  parcelas:    z.number().int().positive().nullable().optional(),
  parcelaAtual:z.number().int().positive().nullable().optional(),
  recorrente:  z.boolean().optional().default(false),
});

/** Project a recurring lancamento into a given year/month (same day, capped at last day of month). */
function projectar(l: any, year: number, month: number) {
  const origDay = new Date(l.data).getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day     = Math.min(origDay, lastDay);
  return { ...l, data: new Date(year, month, day).toISOString(), _projetado: true };
}

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const { searchParams } = request.nextUrl;
    const tipo        = searchParams.get('tipo');
    const categoriaId = searchParams.get('categoriaId');
    const start       = searchParams.get('start');
    const end         = searchParams.get('end');
    const search      = searchParams.get('search');
    const limit       = parseInt(searchParams.get('limit') || '500', 10);
    const orderBy     = searchParams.get('orderBy') || 'data';
    const orderDir    = (searchParams.get('orderDir') as 'asc' | 'desc') || 'desc';

    const recorrenteFilter = searchParams.get('recorrente');

    const where: any = { userId };
    if (tipo)        where.tipo        = tipo;
    if (categoriaId) where.categoriaId = categoriaId;
    if (recorrenteFilter === 'true')  where.recorrente = true;
    if (recorrenteFilter === 'false') where.recorrente = false;
    if (start || end) {
      where.data = {};
      if (start) where.data.gte = new Date(start);
      if (end)   where.data.lt  = new Date(end);
    }
    if (search) {
      where.descricao = { contains: search, mode: 'insensitive' };
    }

    const lancamentos = await prisma.lancamento.findMany({
      where,
      include: { categoria: true },
      orderBy: { [orderBy]: orderDir },
      take: limit,
    });

    // ── Inject projected recurring entries (only when querying by date range, not when filtering by recorrente) ──
    let projetados: any[] = [];
    if (start && end && recorrenteFilter !== 'true') {
      const startDate = new Date(start);
      const year  = startDate.getFullYear();
      const month = startDate.getMonth();

      // Recurring lancamentos created BEFORE this month
      const recorrentes = await prisma.lancamento.findMany({
        where: {
          userId,
          recorrente: true,
          data: { lt: startDate },
          ...(tipo ? { tipo } : {}),
        },
        include: { categoria: true },
      });

      projetados = recorrentes
        .filter(r => !search || r.descricao.toLowerCase().includes(search.toLowerCase()))
        .filter(r => !categoriaId || r.categoriaId === categoriaId)
        .map(r => projectar(r, year, month));
    }

    // Merge: regular entries + projected (sorted by data desc by default)
    const all = [...lancamentos, ...projetados].sort((a, b) => {
      const da = new Date(a.data).getTime();
      const db = new Date(b.data).getTime();
      return orderDir === 'asc' ? da - db : db - da;
    });

    return { data: all };
  });
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body   = await request.json();
    const parsed = createSchema.parse(body);

    const cat = await prisma.categoria.findFirst({
      where: { id: parsed.categoriaId, userId },
    });
    if (!cat) throw new Error('Categoria inválida');

    const lancamento = await prisma.lancamento.create({
      data: {
        ...parsed,
        userId,
        data: new Date(parsed.data),
      },
      include: { categoria: true },
    });
    return { data: lancamento };
  });
}
