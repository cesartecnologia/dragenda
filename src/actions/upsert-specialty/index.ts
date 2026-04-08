'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { upsertSpecialtyRecord } from '@/server/clinic-data';

import { upsertSpecialtySchema } from './schema';

export const upsertSpecialty = actionClient.schema(upsertSpecialtySchema).action(async ({ parsedInput }) => {
  const session = await auth.api.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  if (!session.user.clinic?.id) throw new Error('Clinic not found');

  await upsertSpecialtyRecord({
    id: parsedInput.id,
    clinicId: session.user.clinic.id,
    name: parsedInput.name,
  });

  ['/especialidades', '/medicos', '/agendamentos', '/painel'].forEach((path) => revalidatePath(path));
});
