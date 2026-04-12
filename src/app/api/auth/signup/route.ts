import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { DEFAULT_CATEGORIAS_SAIDA, DEFAULT_CATEGORIAS_ENTRADA } from '@/lib/default-categories';

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
});

/**
 * POST /api/auth/signup — create a new user account.
 * Automatically seeds default categories and a default monthly goal.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: 'Já existe uma conta com esse email' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user + default data in a single transaction
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
        },
      });

      // Default categories
      await tx.categoria.createMany({
        data: [
          ...DEFAULT_CATEGORIAS_SAIDA.map((c) => ({ ...c, tipo: 'saida', userId: u.id })),
          ...DEFAULT_CATEGORIAS_ENTRADA.map((c) => ({
            ...c,
            tipo: 'entrada',
            orcamento: null,
            userId: u.id,
          })),
        ],
      });

      // Default monthly goal
      await tx.configuracao.create({
        data: { userId: u.id, chave: 'meta_mensal', valor: '3000' },
      });

      return u;
    });

    // Auto-login after signup
    const session = await getSession();
    session.isLoggedIn = true;
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    await session.save();

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    console.error('[AUTH SIGNUP]', e);
    return NextResponse.json({ error: e.message || 'Erro no servidor' }, { status: 500 });
  }
}
