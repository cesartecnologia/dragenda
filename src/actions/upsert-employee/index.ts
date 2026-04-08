'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { provisionEmployeeAuthAccount } from '@/server/employee-auth';
import { upsertEmployeeRecord } from '@/server/clinic-data';

export const upsertEmployee = actionClient.schema(z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'attendant']),
  active: z.boolean().default(true),
  createAccessNow: z.boolean().default(false),
  temporaryPassword: z.string().min(8).optional(),
})).action(async ({ parsedInput }) => {
  const session = await auth.api.getSession();
  if (!session?.user?.clinic?.id) throw new Error('Clinic not found');
  const employee = await upsertEmployeeRecord({
    id: parsedInput.id,
    clinicId: session.user.clinic.id,
    name: parsedInput.name,
    email: parsedInput.email,
    role: parsedInput.role,
    active: parsedInput.active,
  });

  let access = null;
  if (parsedInput.createAccessNow) {
    access = await provisionEmployeeAuthAccount({
      email: parsedInput.email,
      name: parsedInput.name,
      password: parsedInput.temporaryPassword,
    });
  }

  ['/funcionarios'].forEach((path) => revalidatePath(path));

  return {
    employeeId: employee.id,
    createdAccess: Boolean(access),
    temporaryPassword: access?.password ?? null,
    loginEmail: access?.email ?? parsedInput.email,
  };
});
