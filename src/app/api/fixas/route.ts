import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const createSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(),
  diaVencimento: z.number().int().min(1).max(31),
  categoriaId: z.string().min(1),
  dataInicio: z.string().or(z.date()),
  dataFim: z.string().or(z.date()).nullable().optional(),
  status: z.enum(['ativa', 'pausada', 'encerrada']).optional(),
});

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const status = request.nextUrl.searchParams.get('status');
    const where: any = { userId };
    if (status) where.status = status;
    const fixas = await prisma.despesaFixa.findMany({
      where,
      include: { categoria: true, historico: { orderBy: { dataAlteracao: 'desc' } } },
      orderBy: { diaVencimento: 'asc' },
    });
    return { data: fixas };
  });
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const cat = await prisma.categoria.findFirst({
      where: { id: parsed.categoriaId, userId },
    });
    if (!cat) throw new Error('Categoria inválida');

    const fixa = await prisma.despesaFixa.create({
      data: {
        ...parsed,
        userId,
        dataInicio: new Date(parsed.dataInicio),
        dataFim: parsed.dataFim ? new Date(parsed.dataFim) : null,
      },
      include: { categoria: true },
    });
    return { data: fixa };
  });
}
