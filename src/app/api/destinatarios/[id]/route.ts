import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const updateSchema = z.object({
  padrao: z.string().min(1).optional(),
  categoriaId: z.string().min(1).optional(),
  tipo: z.enum(['entrada', 'saida']).optional(),
  descricao: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const regra = await prisma.regraDestinatario.updateMany({
      where: { id: params.id, userId },
      data,
    });
    return { data: regra };
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    await prisma.regraDestinatario.deleteMany({
      where: { id: params.id, userId },
    });
    return { data: { ok: true } };
  });
}
