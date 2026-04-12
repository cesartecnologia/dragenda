import { NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase-admin';
import { upsertUserProfile } from '@/server/clinic-data';

const validateEmail = (email: string) => /.+@.+\..+/.test(email);

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!name) {
      return NextResponse.json({ error: 'MISSING_NAME' }, { status: 400 });
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    let user;

    try {
      user = await adminAuth.createUser({
        displayName: name,
        email,
        password,
        emailVerified: false,
      });
    } catch (error: any) {
      if (error?.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'USER_ALREADY_EXISTS' }, { status: 409 });
      }
      throw error;
    }

    await upsertUserProfile({
      id: user.uid,
      email,
      name,
      image: null,
      emailVerified: false,
    });

    return NextResponse.json({ ok: true, uid: user.uid });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'REGISTER_FAILED',
        details: error?.message ?? 'Unknown register error',
      },
      { status: 500 },
    );
  }
};
