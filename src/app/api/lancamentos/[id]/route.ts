import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const updateSchema = z.object({
  descricao: z.string().min(1).optional(),
  valor: z.number().positive().optional(),
  tipo: z.enum(['entrada', 'saida']).optional(),
  data: z.string().or(z.date()).optional(),
  categoriaId: z.string().optional(),
  tags: z.string().nullable().optional(),
  parcelas: z.number().int().positive().nullable().optional(),
  parcelaAtual: z.number().int().positive().nullable().optional(),
});

async function ensureOwned(userId: string, id: string) {
  const l = await prisma.lancamento.findFirst({ where: { id, userId } });
  if (!l) throw new Error('Lançamento não encontrado');
  return l;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    await ensureOwned(userId, params.id);
    const body = await request.json();
    const data = updateSchema.parse(body);

    if (data.categoriaId) {
      const cat = await prisma.categoria.findFirst({
        where: { id: data.categoriaId, userId },
      });
      if (!cat) throw new Error('Categoria inválida');
    }

    const lancamento = await prisma.lancamento.update({
      where: { id: params.id },
      data: { ...data, ...(data.data ? { data: new Date(data.data) } : {}) },
      include: { categoria: true },
    });
    return { data: lancamento };
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    await ensureOwned(userId, params.id);
    await prisma.lancamento.delete({ where: { id: params.id } });
    return { success: true };
  });
}
