import { createAsaasCheckoutSession } from '@/lib/asaas';
import { attachAsaasCheckoutToSession, createCheckoutSession } from '@/server/checkout-sessions';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

export type PublicCheckoutMethod = 'credit_card' | 'boleto';

export async function startPublicCheckout(paymentMethod: PublicCheckoutMethod) {
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
  }

  const session = await createCheckoutSession({ paymentMethod });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;

  const checkout = await createAsaasCheckoutSession({
    billingTypes: [paymentMethod === 'boleto' ? 'BOLETO' : 'CREDIT_CARD'],
    planName: PLAN_LABEL,
    description: 'Assinatura mensal do plano premium.',
    value: PLAN_VALUE,
    successUrl: callbackBase,
    cancelUrl: `${callbackBase}&checkout=cancelled`,
    expiredUrl: `${callbackBase}&checkout=expired`,
    externalReference: session.id,
  });

  await attachAsaasCheckoutToSession(session.id, {
    asaasCheckoutId: checkout.id,
    checkoutUrl: checkout.checkoutUrl,
  });

  return {
    sessionId: session.id,
    checkoutId: checkout.id,
    checkoutUrl: checkout.checkoutUrl,
  };
}
