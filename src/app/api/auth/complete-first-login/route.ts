import { NextResponse } from 'next/server';

import { getServerSession } from '@/lib/auth';
import { completeUserFirstLogin } from '@/server/clinic-data';

export const POST = async () => {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    await completeUserFirstLogin({
      userId: session.user.id,
      email: session.user.email,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'FIRST_LOGIN_COMPLETE_FAILED',
        details: error?.message ?? 'Unknown first login completion error',
      },
      { status: 500 },
    );
  }
};
