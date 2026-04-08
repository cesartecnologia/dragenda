'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { deleteSpecialtyRecord, listSpecialtiesByClinicId } from '@/server/clinic-data';

export const deleteSpecialty = actionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession();
    if (!session?.user) throw new Error('Unauthorized');
    if (!session.user.clinic?.id) throw new Error('Clinic not found');

    const specialties = await listSpecialtiesByClinicId(session.user.clinic.id);
    const specialty = specialties.find((item) => item.id === parsedInput.id);
    if (!specialty) throw new Error('Especialidade não encontrada.');

    await deleteSpecialtyRecord(parsedInput.id);
    ['/especialidades', '/medicos', '/agendamentos', '/painel'].forEach(revalidatePath);
  });
