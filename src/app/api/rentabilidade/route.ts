import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

export async function GET() {
  return withUser(async (userId) => {
    const configs = await prisma.rentabilidadeConfig.findMany({ where: { userId } });
    return { data: configs };
  });
}

const upsertSchema = z.object({
  classe: z.enum(['renda_fixa', 'acoes', 'fiis', 'cripto', 'internacional', 'outros']),
  taxaMensal: z.number().min(0).max(100),
});

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const { classe, taxaMensal } = upsertSchema.parse(body);
    const config = await prisma.rentabilidadeConfig.upsert({
      where: { userId_classe: { userId, classe } },
      update: { taxaMensal },
      create: { userId, classe, taxaMensal },
    });
    return { data: config };
  });
}
