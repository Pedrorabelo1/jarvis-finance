import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const createSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(),
  classe: z.string().optional().nullable(),
  categoriaInvestimentoId: z.string().optional().nullable(),
  data: z.string().or(z.date()),
  quantidadeBTC: z.number().min(0).optional().nullable(),
});

export async function GET() {
  return withUser(async (userId) => {
    const investimentos = await prisma.investimento.findMany({
      where: { userId },
      include: {
        categoriaInvestimento: {
          select: { id: true, nome: true, cor: true, icone: true },
        },
      },
      orderBy: { data: 'desc' },
    });
    return { data: investimentos };
  });
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const inv = await prisma.investimento.create({
      data: {
        descricao: parsed.descricao,
        valor: parsed.valor,
        classe: parsed.classe,
        categoriaInvestimentoId: parsed.categoriaInvestimentoId,
        quantidadeBTC: parsed.quantidadeBTC,
        userId,
        data: new Date(parsed.data as string),
      },
      include: {
        categoriaInvestimento: {
          select: { id: true, nome: true, cor: true, icone: true },
        },
      },
    });
    return { data: inv };
  });
}
