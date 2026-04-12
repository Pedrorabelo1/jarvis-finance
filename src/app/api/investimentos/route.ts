import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const createSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number().positive(),
  classe: z.enum(['renda_fixa', 'acoes', 'fiis', 'cripto', 'internacional', 'outros']),
  data: z.string().or(z.date()),
});

export async function GET() {
  return withUser(async (userId) => {
    const investimentos = await prisma.investimento.findMany({
      where: { userId },
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
      data: { ...parsed, userId, data: new Date(parsed.data) },
    });
    return { data: inv };
  });
}
