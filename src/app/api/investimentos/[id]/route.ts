import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

const updateSchema = z.object({
  descricao: z.string().optional(),
  valor: z.number().positive().optional(),
  classe: z.enum(['renda_fixa', 'acoes', 'fiis', 'cripto', 'internacional', 'outros']).optional(),
  data: z.string().or(z.date()).optional(),
});

async function ensureOwned(userId: string, id: string) {
  const i = await prisma.investimento.findFirst({ where: { id, userId } });
  if (!i) throw new Error('Investimento não encontrado');
  return i;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    await ensureOwned(userId, params.id);
    const body = await request.json();
    const data = updateSchema.parse(body);
    const inv = await prisma.investimento.update({
      where: { id: params.id },
      data: { ...data, ...(data.data ? { data: new Date(data.data) } : {}) },
    });
    return { data: inv };
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    await ensureOwned(userId, params.id);
    await prisma.investimento.delete({ where: { id: params.id } });
    return { success: true };
  });
}
