import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const createSchema = z.object({
  nome: z.string().min(1),
  tipo: z.enum(['entrada', 'saida']),
  icone: z.string().min(1),
  cor: z.string().min(1),
  orcamento: z.number().nullable().optional(),
});

export async function GET(request: NextRequest) {
  return withUser(async (userId) => {
    const tipo = request.nextUrl.searchParams.get('tipo');
    const where: any = { userId };
    if (tipo) where.tipo = tipo;
    const categorias = await prisma.categoria.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
    return { data: categorias };
  });
}

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const data = createSchema.parse(body);
    const categoria = await prisma.categoria.create({
      data: { ...data, userId },
    });
    return { data: categoria };
  });
}
