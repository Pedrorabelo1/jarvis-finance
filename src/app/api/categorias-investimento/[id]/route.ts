import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const updateSchema = z.object({
  nome: z.string().min(1).max(50).optional(),
  cor: z.string().optional(),
  icone: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const cat = await prisma.categoriaInvestimento.updateMany({
      where: { id: params.id, userId },
      data,
    });
    return { data: cat };
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    await prisma.categoriaInvestimento.deleteMany({
      where: { id: params.id, userId },
    });
    return { data: { ok: true } };
  });
}
