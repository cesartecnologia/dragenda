import { NextResponse } from 'next/server';

import { createAsaasRecurringCheckout } from '@/lib/asaas';
import { createCheckoutSession, updateCheckoutSession } from '@/server/checkout-sessions';
import {
  normalizePublicCheckoutInput,
  PLAN_DESCRIPTION,
  PLAN_ID,
  PLAN_LABEL,
  PLAN_VALUE,
  validatePublicCheckoutInput,
} from '@/server/public-checkout';

export const POST = async (request: Request) => {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const input = normalizePublicCheckoutInput(body);
    const validationError = validatePublicCheckoutInput(input);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const session = await createCheckoutSession({
      planId: PLAN_ID,
      planName: PLAN_LABEL,
      value: PLAN_VALUE,
      paymentMethod: 'credit_card',
      status: 'waiting_payment',
      customerName: input.responsibleName,
      companyName: input.clinicName,
      customerEmail: input.email,
      customerPhone: input.clinicPhoneNumber,
      customerCpfCnpj: input.clinicCnpj,
      customerAddress: input.clinicAddress,
      customerAddressNumber: input.clinicAddressNumber,
      customerAddressComplement: input.clinicAddressComplement,
      customerPostalCode: input.clinicPostalCode,
      customerProvince: input.clinicProvince,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    const checkout = await createAsaasRecurringCheckout({
      customerData: {
        name: input.clinicName,
        email: input.email,
        cpfCnpj: input.clinicCnpj,
        phone: input.clinicPhoneNumber,
        address: input.clinicAddress,
        addressNumber: input.clinicAddressNumber,
        complement: input.clinicAddressComplement,
        province: input.clinicProvince,
        postalCode: input.clinicPostalCode,
      },
      planName: PLAN_LABEL,
      description: PLAN_DESCRIPTION,
      value: PLAN_VALUE,
      successUrl: `${appUrl}/primeiro-acesso?sessionId=${session.id}`,
      cancelUrl: `${appUrl}/primeiro-acesso?sessionId=${session.id}`,
      expiredUrl: `${appUrl}/primeiro-acesso?sessionId=${session.id}`,
    });

    const updated = await updateCheckoutSession(session.id, {
      checkoutId: checkout.id,
      status: 'waiting_payment',
    });

    return NextResponse.json({ ok: true, checkoutUrl: checkout.checkoutUrl, sessionId: updated.id });
  } catch (error) {
    console.error('PUBLIC_CARD_CHECKOUT_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível abrir a contratação agora.' }, { status: 500 });
  }
};
