'use server';

import { requireSession } from '@/lib/auth';
import { createAsaasRecurringCheckout, upsertAsaasCustomer } from '@/lib/asaas';
import { actionClient } from '@/lib/next-safe-action';
import { parseLegacyClinicAddress } from '@/helpers/clinic-address';
import { createClinicForUser, getClinicById, getUserProfileById, updateUserAsaasSubscription } from '@/server/clinic-data';

const PLAN_NAME = 'essential';
const PLAN_LABEL = 'Plano Profissional';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99');

const normalize = (value?: string | null) => value?.trim() ?? '';

export const createAsaasCheckout = actionClient.action(async () => {
  const session = await requireSession();

  if (session.user.bypassSubscription) {
    throw new Error('Seu perfil não exige assinatura.');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
  }

  const userProfile = await getUserProfileById(session.user.id);
  if (!userProfile) throw new Error('Usuário não encontrado.');

  let clinicId = userProfile.clinicId;
  let clinic = clinicId ? await getClinicById(clinicId) : null;

  if (!clinic) {
    clinic = await createClinicForUser({
      userId: session.user.id,
      name: `Clínica de ${session.user.name.split(' ')[0] || 'Novo cliente'}`,
    });
    clinicId = clinic.id;
  }

  if (!clinicId || !clinic) throw new Error('Clínica não encontrada.');

  const legacyAddress = parseLegacyClinicAddress(clinic.address);
  const address = normalize(clinic.address) || normalize(legacyAddress.address);
  const addressNumber = normalize(clinic.addressNumber) || normalize(legacyAddress.addressNumber);
  const addressComplement = normalize(clinic.addressComplement) || normalize(legacyAddress.addressComplement);
  const postalCode = normalize(clinic.postalCode) || normalize(legacyAddress.postalCode);
  const province = normalize(clinic.province) || normalize(legacyAddress.province);
  const phoneNumber = normalize(clinic.phoneNumber);
  const cnpj = normalize(clinic.cnpj);

  if (!clinic.name?.trim()) throw new Error('Informe o nome da clínica antes de assinar.');
  if (!cnpj) throw new Error('Informe o CNPJ da clínica antes de assinar.');
  if (!phoneNumber) throw new Error('Informe o telefone da clínica antes de assinar.');
  if (!address) throw new Error('Informe o logradouro da clínica antes de assinar.');
  if (!addressNumber) throw new Error('Informe o número da clínica antes de assinar.');
  if (!postalCode) throw new Error('Informe o CEP da clínica antes de assinar.');
  if (!province) throw new Error('Informe o bairro da clínica antes de assinar.');

  const customer = await upsertAsaasCustomer({
    asaasCustomerId: clinic.asaasCustomerId ?? userProfile.asaasCustomerId,
    name: clinic.name || session.user.name,
    email: session.user.email,
    cpfCnpj: cnpj,
    mobilePhone: phoneNumber,
    address,
    addressNumber,
    complement: addressComplement || undefined,
    postalCode,
    province,
  });

  await updateUserAsaasSubscription(session.user.id, {
    asaasCustomerId: customer.id,
    subscriptionStatus: 'checkout_pending',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const checkout = await createAsaasRecurringCheckout({
    customerData: {
      name: clinic.name || session.user.name,
      cpfCnpj: cnpj,
      email: session.user.email,
      phone: phoneNumber,
      address,
      addressNumber,
      complement: addressComplement || undefined,
      postalCode,
      province,
    },
    planName: PLAN_LABEL,
    description: 'Assinatura mensal para liberar o acesso completo da clínica.',
    value: PLAN_VALUE,
    successUrl: `${appUrl}/assinatura?checkout=success`,
    cancelUrl: `${appUrl}/assinatura?checkout=cancelled`,
    expiredUrl: `${appUrl}/assinatura?checkout=expired`,
    clinicName: clinic.name,
  });

  await updateUserAsaasSubscription(session.user.id, {
    asaasCustomerId: customer.id,
    asaasCheckoutId: checkout.id,
    subscriptionStatus: 'checkout_pending',
  });

  return {
    checkoutUrl: checkout.checkoutUrl,
    checkoutId: checkout.id,
    plan: PLAN_NAME,
  };
});
