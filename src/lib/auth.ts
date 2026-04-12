import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  isLoggedIn: boolean;
  userId?: string;
  email?: string;
  name?: string;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    'fallback-please-change-me-this-must-be-32-chars-min',
  cookieName: 'jarvis_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

export async function isAuthenticated() {
  const session = await getSession();
  return session.isLoggedIn === true && !!session.userId;
}

/**
 * Server-side helper to get the authenticated userId.
 * Throws if user is not logged in — meant to be caught by API routes that
 * return a 401 response.
 */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    throw new Error('UNAUTHORIZED');
  }
  return session.userId;
}
