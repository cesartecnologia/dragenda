'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { updateClinicSettings } from '@/server/clinic-data';

const optionalText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}, z.string().nullable().optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}, z.string().url().nullable().optional());

export const updateClinicSettingsAction = actionClient
  .schema(
    z.object({
      name: z.string().trim().min(1),
      cnpj: optionalText,
      address: optionalText,
      addressNumber: optionalText,
      addressComplement: optionalText,
      postalCode: optionalText,
      province: optionalText,
      phoneNumber: optionalText,
      logoUrl: optionalUrl,
      cloudinaryPublicId: optionalText,
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession();
    if (!session?.user?.clinic?.id) throw new Error('Clinic not found');
    await updateClinicSettings(session.user.clinic.id, parsedInput);
    ['/configuracoes/clinica', '/clinic-form', '/painel', '/dashboard', '/assinatura', '/pos-login'].forEach((path) =>
      revalidatePath(path),
    );
  });
