'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { createClinicForUser } from '@/server/clinic-data';

export const createClinic = async (name: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  await createClinicForUser({ userId: session.user.id, name });
  redirect('/configuracoes/clinica');
};
