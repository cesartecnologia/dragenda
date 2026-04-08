'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { upsertEmployeeRecord } from '@/server/clinic-data';

export const upsertEmployee = actionClient.schema(z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'attendant']),
  active: z.boolean().default(true),
})).action(async ({ parsedInput }) => {
  const session = await auth.api.getSession();
  if (!session?.user?.clinic?.id) throw new Error('Clinic not found');
  await upsertEmployeeRecord({ ...parsedInput, clinicId: session.user.clinic.id });
  ['/funcionarios'].forEach((path) => revalidatePath(path));
});
