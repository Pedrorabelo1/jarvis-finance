import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withUser(async (userId) => {
    await prisma.rendimentoMensal.deleteMany({
      where: { id: params.id, userId },
    });
    return { data: { ok: true } };
  });
}
