import { NextResponse } from 'next/server';

import { createAsaasPaymentLink } from '@/lib/asaas';
import { attachAsaasPaymentLinkToSession, createCheckoutSession } from '@/server/checkout-sessions';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

export const POST = async () => {
  try {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
    }

    const session = await createCheckoutSession({ paymentMethod: 'boleto' });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;

    const paymentLink = await createAsaasPaymentLink({
      billingType: 'BOLETO',
      chargeType: 'RECURRENT',
      subscriptionCycle: 'MONTHLY',
      dueDateLimitDays: 3,
      name: PLAN_LABEL,
      description: 'Assinatura mensal para liberar o acesso completo da clínica.',
      value: PLAN_VALUE,
      successUrl: callbackBase,
      externalReference: session.id,
      autoRedirect: false,
      notificationEnabled: true,
    });

    await attachAsaasPaymentLinkToSession(session.id, {
      asaasPaymentLinkId: paymentLink.id,
      checkoutUrl: paymentLink.url,
    });

    return NextResponse.json({ ok: true, checkoutUrl: paymentLink.url, sessionId: session.id });
  } catch (error) {
    console.error('PUBLIC_BOLETO_LINK_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível abrir o pagamento por boleto agora.' }, { status: 500 });
  }
};
