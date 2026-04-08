import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/lib/auth';

export const POST = async () => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return NextResponse.json({ ok: true });
};
