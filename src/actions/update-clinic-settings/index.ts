'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { createClinicForUser, updateClinicSettings } from '@/server/clinic-data';

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

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}, z.string().email().nullable().optional());

export const updateClinicSettingsAction = actionClient.schema(z.object({
  name: z.string().trim().min(1),
  cnpj: optionalText,
  address: optionalText,
  phoneNumber: optionalText,
  logoUrl: optionalUrl,
  cloudinaryPublicId: optionalText,
  responsibleName: optionalText,
  responsibleEmail: optionalEmail,
  responsibleCpf: optionalText,
  companyType: z.enum(['MEI', 'LIMITED', 'INDIVIDUAL', 'ASSOCIATION']).nullable().optional(),
  postalCode: optionalText,
  addressNumber: optionalText,
  complement: optionalText,
  province: optionalText,
  website: optionalUrl,
})).action(async ({ parsedInput }) => {
  const session = await auth.api.getSession();
  if (!session?.user?.id) throw new Error('Usuário não autenticado.');

  let clinicId = session.user.clinic?.id ?? null;

  if (!clinicId) {
    const clinic = await createClinicForUser({ userId: session.user.id, name: parsedInput.name });
    clinicId = clinic.id;
  }

  if (!clinicId) throw new Error('Clínica não encontrada.');

  await updateClinicSettings(clinicId, parsedInput);
  ['/configuracoes/clinica', '/clinic-form', '/painel', '/dashboard', '/assinatura'].forEach((path) => revalidatePath(path));

  return {
    clinicId,
  };
});
