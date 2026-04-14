import { NextResponse } from 'next/server';

import { createAsaasRecurringCheckout, upsertAsaasCustomer } from '@/lib/asaas';
import { createPendingSignupIntent, attachCheckoutToPendingSignup, updatePendingSignup } from '@/server/pending-signups';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');
const onlyDigits = (value?: string) => (value ?? '').replace(/\D/g, '');

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as {
      responsibleName?: string;
      email?: string;
      clinicName?: string;
      clinicCnpj?: string;
      clinicPhoneNumber?: string;
      clinicAddress?: string;
      clinicAddressNumber?: string;
      clinicAddressComplement?: string;
      clinicPostalCode?: string;
      clinicProvince?: string;
    };

    const responsibleName = body.responsibleName?.trim();
    const email = body.email?.trim().toLowerCase();
    const clinicName = body.clinicName?.trim();
    const clinicCnpj = onlyDigits(body.clinicCnpj);
    const clinicPhoneNumber = onlyDigits(body.clinicPhoneNumber);
    const clinicAddress = body.clinicAddress?.trim();
    const clinicAddressNumber = body.clinicAddressNumber?.trim();
    const clinicAddressComplement = body.clinicAddressComplement?.trim() || null;
    const clinicPostalCode = onlyDigits(body.clinicPostalCode);
    const clinicProvince = body.clinicProvince?.trim();

    if (!responsibleName || !email || !clinicName || clinicCnpj.length !== 14 || clinicPhoneNumber.length < 10 || !clinicAddress || !clinicAddressNumber || clinicPostalCode.length !== 8 || !clinicProvince) {
      return NextResponse.json({ error: 'Preencha todos os dados obrigatórios para abrir o checkout.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
    }

    const intent = await createPendingSignupIntent({
      paymentMethod: 'credit_card',
      status: 'checkout_created',
      payerName: responsibleName,
      payerEmail: email,
      payerPhone: clinicPhoneNumber,
      payerCpfCnpj: clinicCnpj,
      clinicName,
      clinicCnpj,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      complement: clinicAddressComplement,
      postalCode: clinicPostalCode,
      province: clinicProvince,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    const customer = await upsertAsaasCustomer({
      name: clinicName,
      email,
      cpfCnpj: clinicCnpj,
      phone: clinicPhoneNumber,
      mobilePhone: clinicPhoneNumber,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      complement: clinicAddressComplement,
      province: clinicProvince,
      postalCode: clinicPostalCode,
      externalReference: intent.id,
    });

    const checkout = await createAsaasRecurringCheckout({
      customerId: customer.id,
      planName: PLAN_LABEL,
      description: 'Assinatura mensal para liberar o acesso completo da clínica.',
      value: PLAN_VALUE,
      successUrl: `${appUrl}/primeiro-acesso?intentId=${intent.id}&checkout=success`,
      cancelUrl: `${appUrl}/assinatura?checkout=cancelled`,
      expiredUrl: `${appUrl}/assinatura?checkout=expired`,
    });

    await attachCheckoutToPendingSignup(intent.id, checkout.id);
    await updatePendingSignup(intent.id, {
      asaasCustomerId: customer.id,
      clinicName,
      clinicCnpj,
      payerName: responsibleName,
      payerEmail: email,
      payerPhone: clinicPhoneNumber,
      payerCpfCnpj: clinicCnpj,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      complement: clinicAddressComplement,
      postalCode: clinicPostalCode,
      province: clinicProvince,
    });

    return NextResponse.json({ ok: true, checkoutUrl: checkout.checkoutUrl, intentId: intent.id });
  } catch (error) {
    console.error('PUBLIC_CARD_CHECKOUT_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível abrir a contratação agora.' }, { status: 500 });
  }
};
