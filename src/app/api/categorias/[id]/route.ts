import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const updateSchema = z.object({
  nome: z.string().min(1).optional(),
  icone: z.string().optional(),
  cor: z.string().optional(),
  orcamento: z.number().nullable().optional(),
});

async function ensureOwned(userId: string, id: string) {
  const cat = await prisma.categoria.findFirst({ where: { id, userId } });
  if (!cat) throw new Error('Categoria não encontrada');
  return cat;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    await ensureOwned(userId, params.id);
    const body = await request.json();
    const data = updateSchema.parse(body);
    const categoria = await prisma.categoria.update({
      where: { id: params.id },
      data,
    });
    return { data: categoria };
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    await ensureOwned(userId, params.id);
    const count = await prisma.lancamento.count({
      where: { categoriaId: params.id, userId },
    });
    const fixaCount = await prisma.despesaFixa.count({
      where: { categoriaId: params.id, userId },
    });
    if (count > 0 || fixaCount > 0) {
      throw new Error(`Categoria possui ${count + fixaCount} registros vinculados`);
    }
    await prisma.categoria.delete({ where: { id: params.id } });
    return { success: true };
  });
}
