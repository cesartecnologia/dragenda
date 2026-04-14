'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { deleteEmployeeAuthAccount } from '@/server/employee-auth';
import { deleteEmployeeRecord, getEmployeeById } from '@/server/clinic-data';

export const deleteEmployee = actionClient
  .schema(
    z.object({
      id: z.string().uuid(),
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

    if (employee.email === session.user.email) {
      throw new Error('Você não pode excluir o próprio acesso.');
    }

    await deleteEmployeeRecord(parsedInput.id);
    await deleteEmployeeAuthAccount(employee.email);

    ['/funcionarios'].forEach((path) => revalidatePath(path));
  });
