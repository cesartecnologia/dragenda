'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { upsertPatientRecord } from '@/server/clinic-data';

import { upsertPatientSchema } from './schema';

export const upsertPatient = actionClient.schema(upsertPatientSchema).action(async ({ parsedInput }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error('Unauthorized');
  if (!session.user.clinic?.id) throw new Error('Clinic not found');

  await upsertPatientRecord({
    id: parsedInput.id,
    clinicId: session.user.clinic.id,
    name: parsedInput.name,
    email: parsedInput.email,
    phoneNumber: parsedInput.phoneNumber,
    address: parsedInput.address,
    sex: parsedInput.sex,
  });

  ['/pacientes', '/agendamentos', '/painel', '/patients', '/appointments', '/dashboard'].forEach(revalidatePath);
});
