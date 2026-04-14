'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { provisionEmployeeAuthAccount } from '@/server/employee-auth';
import { getEmployeeById, upsertEmployeeRecord } from '@/server/clinic-data';

export const resetEmployeePassword = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      temporaryPassword: z.string().min(8, 'Informe pelo menos 8 caracteres.').optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession();

    if (!session?.user?.clinic?.id) {
      throw new Error('Unauthorized');
    }

    const employee = await getEmployeeById(parsedInput.id);

    if (!employee || employee.clinicId !== session.user.clinic.id) {
      throw new Error('Usuário não encontrado.');
    }

    const access = await provisionEmployeeAuthAccount({
      email: employee.email,
      name: employee.name,
      password: parsedInput.temporaryPassword,
    });

    await upsertEmployeeRecord({
      id: employee.id,
      clinicId: employee.clinicId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      active: employee.active,
      mustChangePassword: true,
    });

    ['/funcionarios'].forEach((path) => revalidatePath(path));

    return {
      email: access.email,
      temporaryPassword: access.password,
    };
  });
