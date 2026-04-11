'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/access';
import { actionClient } from '@/lib/next-safe-action';
import { deleteAppointmentRecord, getAppointmentById } from '@/server/clinic-data';

export const deleteAppointment = actionClient
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

    const appointment = await getAppointmentById(parsedInput.id);

    if (!appointment || appointment.clinicId != session.user.clinic?.id) {
      throw new Error('Appointment not found');
    }

    if (!isAdminRole(session.user.role)) {
      throw new Error('Somente administradores podem excluir agendamentos.');
    }

    await deleteAppointmentRecord(parsedInput.id);
    ['/agendamentos','/painel','/appointments','/dashboard'].forEach((path) => revalidatePath(path));
  });
