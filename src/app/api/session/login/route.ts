import { randomUUID } from 'crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, SESSION_LOCK_COOKIE_NAME } from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase-admin';
import { acquireUserLoginLock, upsertUserProfile } from '@/server/clinic-data';

const SESSION_DURATION_IN_MS = 1000 * 60 * 60 * 24 * 5;

const buildResponseError = (message: string, status = 500) =>
  NextResponse.json(
    {
      error: 'SESSION_LOGIN_FAILED',
      details: message,
    },
    { status },
  );

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as {
      idToken?: string;
      profile?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        emailVerified?: boolean;
      };
    };

    if (!body.idToken) {
      return NextResponse.json({ error: 'MISSING_ID_TOKEN' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(body.idToken);
    const email = body.profile?.email?.trim() || decodedToken.email?.trim();

    if (!email) {
      return NextResponse.json({ error: 'MISSING_EMAIL' }, { status: 400 });
    }

    const lockId = randomUUID();
    const lockResult = await acquireUserLoginLock({
      userId: decodedToken.uid,
      lockId,
    });

    if (!lockResult.ok) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_LOGIN_BLOCKED',
          details: 'Usuário já está ativo em outro acesso.',
        },
        { status: 409 },
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_DURATION_IN_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION_IN_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    cookieStore.set(SESSION_LOCK_COOKIE_NAME, lockId, {
      maxAge: SESSION_DURATION_IN_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    const profileSyncPromise = upsertUserProfile({
      id: decodedToken.uid,
      email,
      name: body.profile?.name ?? decodedToken.name ?? null,
      image: body.profile?.image ?? decodedToken.picture ?? null,
      emailVerified: body.profile?.emailVerified ?? decodedToken.email_verified,
    })
      .then(() => true)
      .catch((error) => {
        console.error('SESSION_PROFILE_SYNC_FAILED', error);
        return false;
      });

    // Keep login responsive: don't block response for long profile syncs.
    const profileSynced = await Promise.race([profileSyncPromise, wait(650).then(() => false)]);
    return NextResponse.json({ ok: true, profileSynced });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown session login error';
    console.error('SESSION_LOGIN_FAILED', error);

    if (message === 'MISSING_EMAIL' || message === 'MISSING_ID_TOKEN') {
      return buildResponseError(message, 400);
    }

    return buildResponseError(message, 500);
  }
};
