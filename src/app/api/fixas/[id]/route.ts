import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const updateSchema = z.object({
  descricao: z.string().optional(),
  valor: z.number().positive().optional(),
  diaVencimento: z.number().int().min(1).max(31).optional(),
  categoriaId: z.string().optional(),
  dataInicio: z.string().or(z.date()).optional(),
  dataFim: z.string().or(z.date()).nullable().optional(),
  status: z.enum(['ativa', 'pausada', 'encerrada']).optional(),
});

async function ensureOwned(userId: string, id: string) {
  const f = await prisma.despesaFixa.findFirst({ where: { id, userId } });
  if (!f) throw new Error('Despesa fixa não encontrada');
  return f;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    const current = await ensureOwned(userId, params.id);
    const body = await request.json();
    const data = updateSchema.parse(body);

    if (data.categoriaId) {
      const cat = await prisma.categoria.findFirst({
        where: { id: data.categoriaId, userId },
      });
      if (!cat) throw new Error('Categoria inválida');
    }

    // If valor is changing, log history
    if (data.valor !== undefined && current.valor !== data.valor) {
      await prisma.historicoValor.create({
        data: { despesaFixaId: params.id, valor: current.valor },
      });
    }

    const fixa = await prisma.despesaFixa.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.dataInicio ? { dataInicio: new Date(data.dataInicio) } : {}),
        ...(data.dataFim !== undefined
          ? { dataFim: data.dataFim ? new Date(data.dataFim) : null }
          : {}),
      },
      include: { categoria: true },
    });
    return { data: fixa };
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    await ensureOwned(userId, params.id);
    await prisma.despesaFixa.delete({ where: { id: params.id } });
    return { success: true };
  });
}
