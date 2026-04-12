import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const createSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(),
  tipo: z.enum(['entrada', 'saida']),
  data: z.string().or(z.date()),
  categoriaId: z.string().min(1),
  tags: z.string().nullable().optional(),
  parcelas: z.number().int().positive().nullable().optional(),
  parcelaAtual: z.number().int().positive().nullable().optional(),
});

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const { searchParams } = request.nextUrl;
    const tipo = searchParams.get('tipo');
    const categoriaId = searchParams.get('categoriaId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const orderBy = searchParams.get('orderBy') || 'data';
    const orderDir = (searchParams.get('orderDir') as 'asc' | 'desc') || 'desc';

    const where: any = { userId };
    if (tipo) where.tipo = tipo;
    if (categoriaId) where.categoriaId = categoriaId;
    if (start || end) {
      where.data = {};
      if (start) where.data.gte = new Date(start);
      if (end) where.data.lt = new Date(end);
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

    return { data: lancamentos };
  });
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    // Verify the category belongs to this user
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
