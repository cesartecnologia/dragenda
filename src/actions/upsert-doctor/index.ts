'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { upsertDoctorRecord } from '@/server/clinic-data';

import { upsertDoctorSchema } from './schema';

export const upsertDoctor = actionClient.schema(upsertDoctorSchema).action(async ({ parsedInput }) => {
  const session = await auth.api.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  if (!session.user.clinic?.id) throw new Error('Clinic not found');

  await upsertDoctorRecord({
    id: parsedInput.id,
    clinicId: session.user.clinic.id,
    name: parsedInput.name,
    specialty: parsedInput.specialty,
    crm: parsedInput.crm,
    sex: parsedInput.sex,
    avatarImageUrl: parsedInput.avatarImageUrl || null,
    appointmentPriceInCents: parsedInput.appointmentPriceInCents,
    availabilityRanges: parsedInput.availabilityRanges.map((range, index) => ({
      id: range.id ?? `${index + 1}`,
      startDate: range.startDate,
      endDate: range.endDate,
      fromTime: range.fromTime,
      toTime: range.toTime,
    })),
  });

  ['/medicos', '/agendamentos', '/painel', '/doctors', '/appointments', '/dashboard'].forEach((path) => revalidatePath(path));
});
