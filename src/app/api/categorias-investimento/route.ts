import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

export async function GET() {
  return withUser(async (userId) => {
    const categorias = await prisma.categoriaInvestimento.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return { data: categorias };
  });
}

const createSchema = z.object({
  nome: z.string().min(1).max(50),
  cor: z.string().default('#3b82f6'),
  icone: z.string().default('📈'),
});

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const data = createSchema.parse(body);
    const categoria = await prisma.categoriaInvestimento.create({
      data: { ...data, userId },
    });
    return { data: categoria };
  });
}
