import { NextResponse } from 'next/server';

import { getServerSession } from '@/lib/auth';

export const GET = async () => {
  const session = await getServerSession();

  return NextResponse.json({
    session,
  });
};
