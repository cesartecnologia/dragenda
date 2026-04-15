'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { createClinicForUser, updateClinicSettings } from '@/server/clinic-data';

export const createClinic = async (params: {
  name: string;
  cnpj?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  postalCode?: string | null;
  province?: string | null;
  phoneNumber?: string | null;
  logoUrl?: string | null;
  cloudinaryPublicId?: string | null;
}) => {
  const session = await auth.api.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  if (!session.user.hasSubscriptionAccess && !session.user.bypassSubscription) {
    throw new Error('Pagamento não confirmado.');
  }

  const clinic = await createClinicForUser({ userId: session.user.id, name: params.name });
  await updateClinicSettings(clinic.id, {
    cnpj: params.cnpj ?? null,
    address: params.address ?? null,
    addressNumber: params.addressNumber ?? null,
    addressComplement: params.addressComplement ?? null,
    postalCode: params.postalCode ?? null,
    province: params.province ?? null,
    phoneNumber: params.phoneNumber ?? null,
    logoUrl: params.logoUrl ?? null,
    cloudinaryPublicId: params.cloudinaryPublicId ?? null,
  });

  redirect('/configuracoes/clinica');
};
