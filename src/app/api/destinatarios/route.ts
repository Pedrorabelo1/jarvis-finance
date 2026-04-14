import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

export async function GET() {
  return withUser(async (userId) => {
    const regras = await prisma.regraDestinatario.findMany({
      where: { userId },
      include: { categoria: { select: { id: true, nome: true, cor: true, icone: true } } },
      orderBy: { padrao: 'asc' },
    });
    return { data: regras };
  });
}

const createSchema = z.object({
  padrao: z.string().min(1),
  categoriaId: z.string().min(1),
  tipo: z.enum(['entrada', 'saida']),
  descricao: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const data = createSchema.parse(body);
    const regra = await prisma.regraDestinatario.create({
      data: { ...data, userId },
      include: { categoria: { select: { id: true, nome: true, cor: true, icone: true } } },
    });
    return { data: regra };
  });
}
