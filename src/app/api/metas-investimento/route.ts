import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';

export async function GET() {
  return withUser(async (userId) => {
    const meta = await prisma.metaInvestimento.findUnique({ where: { userId } });
    return { data: meta };
  });
}

const schema = z.object({
  aporteMensal: z.number().min(0).nullable().optional(),
  patrimonioAlvo: z.number().min(0).nullable().optional(),
});

export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const data = schema.parse(body);
    const meta = await prisma.metaInvestimento.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return { data: meta };
  });
}
