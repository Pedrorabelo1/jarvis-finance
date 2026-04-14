import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withUser } from '@/lib/api-helpers';
import { parseExtrato } from '@/lib/extrato-parser';
import { z } from 'zod';

// POST /api/importar — parse arquivo e retorna transações com sugestões
export async function POST(request: NextRequest) {
  return withUser(async (userId) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    const content = await file.text();
    const transacoes = parseExtrato(content, file.name);

    if (transacoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma transação encontrada no arquivo. Verifique o formato (OFX ou CSV).' }, { status: 422 });
    }

    // Busca regras do usuário para auto-categorizar
    const regras = await prisma.regraDestinatario.findMany({
      where: { userId },
      include: { categoria: true },
    });

    const resultado = transacoes.map((t) => {
      // Procura regra que bata com a descrição (case-insensitive)
      const regra = regras.find((r) =>
        t.descricao.toLowerCase().includes(r.padrao.toLowerCase())
      );

      return {
        ...t,
        data: t.data.toISOString(),
        categoriaId: regra?.categoriaId ?? null,
        categoriaNome: regra?.categoria?.nome ?? null,
        descricaoFinal: regra?.descricao ?? t.descricao,
        regraId: regra?.id ?? null,
      };
    });

    return { data: resultado, total: resultado.length };
  });
}

// PUT /api/importar — confirma e salva lançamentos
const confirmarSchema = z.object({
  lancamentos: z.array(z.object({
    descricao: z.string().min(1),
    valor: z.number().positive(),
    tipo: z.enum(['entrada', 'saida']),
    data: z.string(),
    categoriaId: z.string().min(1),
  })),
  salvarRegras: z.array(z.object({
    padrao: z.string().min(1),
    categoriaId: z.string().min(1),
    tipo: z.enum(['entrada', 'saida']),
    descricao: z.string().optional(),
  })).optional(),
});

export async function PUT(request: NextRequest) {
  return withUser(async (userId) => {
    const body = await request.json();
    const { lancamentos, salvarRegras } = confirmarSchema.parse(body);

    // Salva novas regras (ignora se já existe padrão igual)
    if (salvarRegras && salvarRegras.length > 0) {
      const existentes = await prisma.regraDestinatario.findMany({ where: { userId }, select: { padrao: true } });
      const existentesSet = new Set(existentes.map(r => r.padrao.toLowerCase()));

      const novas = salvarRegras.filter(r => !existentesSet.has(r.padrao.toLowerCase()));
      if (novas.length > 0) {
        await prisma.regraDestinatario.createMany({
          data: novas.map(r => ({ ...r, userId })),
        });
      }
    }

    // Cria lançamentos em lote
    const created = await prisma.$transaction(
      lancamentos.map(l =>
        prisma.lancamento.create({
          data: {
            userId,
            descricao: l.descricao,
            valor: l.valor,
            tipo: l.tipo,
            data: new Date(l.data),
            categoriaId: l.categoriaId,
          },
        })
      )
    );

    return { data: { criados: created.length } };
  });
}
