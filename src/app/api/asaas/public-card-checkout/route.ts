import { NextResponse } from 'next/server';

import { createAsaasCheckoutSession } from '@/lib/asaas';
import { attachAsaasCheckoutToSession, createCheckoutSession } from '@/server/checkout-sessions';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

export const POST = async () => {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
    }

    const session = await createCheckoutSession({ paymentMethod: 'credit_card' });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;

    const checkout = await createAsaasCheckoutSession({
      billingTypes: ['CREDIT_CARD'],
      planName: PLAN_LABEL,
      description: 'Assinatura mensal para liberar o acesso completo da clínica.',
      value: PLAN_VALUE,
      successUrl: callbackBase,
      cancelUrl: `${callbackBase}&checkout=cancelled`,
      expiredUrl: `${callbackBase}&checkout=expired`,
    });

    await attachAsaasCheckoutToSession(session.id, {
      asaasCheckoutId: checkout.id,
      checkoutUrl: checkout.checkoutUrl,
    });

    return NextResponse.json({ ok: true, checkoutUrl: checkout.checkoutUrl, sessionId: session.id });
  } catch (error) {
    console.error('PUBLIC_CARD_CHECKOUT_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível abrir o checkout agora.' }, { status: 500 });
  }
};
