import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase-admin';
import { upsertUserProfile } from '@/server/clinic-data';

const SESSION_DURATION_IN_MS = 1000 * 60 * 60 * 24 * 5;

const buildResponseError = (message: string, status = 500) =>
  NextResponse.json(
    {
      error: 'SESSION_LOGIN_FAILED',
      details: message,
    },
    { status },
  );

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

    try {
      await upsertUserProfile({
        id: decodedToken.uid,
        email,
        name: body.profile?.name ?? decodedToken.name ?? null,
        image: body.profile?.image ?? decodedToken.picture ?? null,
        emailVerified: body.profile?.emailVerified ?? decodedToken.email_verified,
      });
    } catch (error) {
      console.error('SESSION_PROFILE_SYNC_FAILED', error);

      return NextResponse.json({
        ok: true,
        profileSynced: false,
      });
    }

    return NextResponse.json({ ok: true, profileSynced: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown session login error';
    console.error('SESSION_LOGIN_FAILED', error);

    if (message === 'MISSING_EMAIL' || message === 'MISSING_ID_TOKEN') {
      return buildResponseError(message, 400);
    }

    return buildResponseError(message, 500);
  }
};
