import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const catId = request.nextUrl.searchParams.get('categoriaId');
    const where: any = { userId };
    if (catId) where.categoriaInvestimentoId = catId;

    const rendimentos = await prisma.rendimentoMensal.findMany({
      where,
      include: {
        categoriaInvestimento: {
          select: { id: true, nome: true, cor: true, icone: true },
        },
      },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });
    return { data: rendimentos };
  });
}

const createSchema = z.object({
  categoriaInvestimentoId: z.string().min(1),
  ano: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  valorRendimento: z.number().nullable().optional(),
  percentual: z.number().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const data = createSchema.parse(body);

    const rendimento = await prisma.rendimentoMensal.upsert({
      where: {
        userId_categoriaInvestimentoId_ano_mes: {
          userId,
          categoriaInvestimentoId: data.categoriaInvestimentoId,
          ano: data.ano,
          mes: data.mes,
        },
      },
      update: {
        valorRendimento: data.valorRendimento,
        percentual: data.percentual,
        observacao: data.observacao,
      },
      create: { ...data, userId },
      include: {
        categoriaInvestimento: {
          select: { id: true, nome: true, cor: true, icone: true },
        },
      },
    });
    return { data: rendimento };
  });
}
