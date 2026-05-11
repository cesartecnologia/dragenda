import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, SESSION_LOCK_COOKIE_NAME } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';
import { releaseUserLoginLock } from '@/server/clinic-data';

export const POST = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const lockId = cookieStore.get(SESSION_LOCK_COOKIE_NAME)?.value ?? null;

  if (sessionCookie && lockId) {
    try {
      const decodedToken = await adminAuth().verifySessionCookie(sessionCookie);
      await releaseUserLoginLock({
        userId: decodedToken.uid,
        lockId,
      });
    } catch (error) {
      console.error('SESSION_LOGOUT_RELEASE_LOCK_FAILED', error);
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  cookieStore.set(SESSION_LOCK_COOKIE_NAME, '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return NextResponse.json({ ok: true });
};
