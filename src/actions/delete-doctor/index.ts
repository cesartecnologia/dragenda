'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { deleteDoctorRecord, getDoctorById } from '@/server/clinic-data';

export const deleteDoctor = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession();

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    const doctor = await getDoctorById(parsedInput.id);

    if (!doctor || doctor.clinicId != session.user.clinic?.id) {
      throw new Error('Doctor not found');
    }

    await deleteDoctorRecord(parsedInput.id);
    ['/medicos','/agendamentos','/painel','/doctors','/appointments','/dashboard'].forEach((path) => revalidatePath(path));
  });
