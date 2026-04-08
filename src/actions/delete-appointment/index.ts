'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { deleteAppointmentRecord, getAppointmentById } from '@/server/clinic-data';

export const deleteAppointment = actionClient
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

    const appointment = await getAppointmentById(parsedInput.id);

    if (!appointment || appointment.clinicId != session.user.clinic?.id) {
      throw new Error('Appointment not found');
    }

    await deleteAppointmentRecord(parsedInput.id);
    ['/agendamentos','/painel','/appointments','/dashboard'].forEach(revalidatePath);
  });
