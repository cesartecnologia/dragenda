import { NextResponse } from 'next/server';

import { createAsaasRecurringCheckout } from '@/lib/asaas';
import { attachCheckoutToPendingSignup, createPendingSignupIntent } from '@/server/pending-signups';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

export const POST = async () => {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
    }

    const intent = await createPendingSignupIntent({
      paymentMethod: 'credit_card',
      status: 'checkout_created',
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    const checkout = await createAsaasRecurringCheckout({
      planName: PLAN_LABEL,
      description: 'Assinatura mensal para liberar o acesso completo da clínica.',
      value: PLAN_VALUE,
      successUrl: `${appUrl}/primeiro-acesso?intentId=${intent.id}&checkout=success`,
      cancelUrl: `${appUrl}/assinatura?checkout=cancelled`,
      expiredUrl: `${appUrl}/assinatura?checkout=expired`,
    });

    await attachCheckoutToPendingSignup(intent.id, checkout.id);

    return NextResponse.json({ ok: true, checkoutUrl: checkout.checkoutUrl, intentId: intent.id });
  } catch (error) {
    console.error('PUBLIC_CARD_CHECKOUT_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível abrir a contratação agora.' }, { status: 500 });
  }
};
