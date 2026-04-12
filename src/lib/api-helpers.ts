import { NextResponse } from 'next/server';
import { requireUserId } from './auth';

/**
 * Wraps an API handler to inject the authenticated userId.
 * Returns 401 if the user is not logged in, 400 on Zod errors,
 * and 500 on unexpected exceptions.
 */
export async function withUser<T>(
  handler: (userId: string) => Promise<T>
): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const data = await handler(userId);
    return NextResponse.json(data);
  } catch (e: any) {
    if (e.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos', details: e.errors }, { status: 400 });
    }
    console.error('[API ERROR]', e);
    return NextResponse.json({ error: e.message || 'Erro no servidor' }, { status: 400 });
  }
}
