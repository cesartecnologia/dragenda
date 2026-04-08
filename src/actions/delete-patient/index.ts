'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { deletePatientRecord, getPatientById } from '@/server/clinic-data';

export const deletePatient = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const patient = await getPatientById(parsedInput.id);

    if (!patient || patient.clinicId != session.user.clinic?.id) {
      throw new Error('Patient not found');
    }

    await deletePatientRecord(parsedInput.id);
    ['/pacientes','/agendamentos','/painel','/patients','/appointments','/dashboard'].forEach(revalidatePath);
  });
