'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { createClinicForUser } from '@/server/clinic-data';

type CreateClinicInput =
  | string
  | {
      name: string;
      cnpj?: string | null;
      address?: string | null;
      addressNumber?: string | null;
      addressComplement?: string | null;
      phoneNumber?: string | null;
      logoUrl?: string | null;
      cloudinaryPublicId?: string | null;
    };

export const createClinic = async (input: CreateClinicInput) => {
  const session = await auth.api.getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const payload = typeof input === 'string' ? { name: input } : input;

  await createClinicForUser({
    userId: session.user.id,
    name: payload.name,
    cnpj: payload.cnpj,
    address: payload.address,
    addressNumber: payload.addressNumber,
    addressComplement: payload.addressComplement,
    phoneNumber: payload.phoneNumber,
    logoUrl: payload.logoUrl,
    cloudinaryPublicId: payload.cloudinaryPublicId,
  });
  redirect('/configuracoes/clinica');
};
