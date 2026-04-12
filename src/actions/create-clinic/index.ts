'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { createClinicForUser } from '@/server/clinic-data';

export const createClinic = async (name: string) => {
  const session = await auth.api.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  await createClinicForUser({ userId: session.user.id, name });
  redirect('/configuracoes/clinica');
};
