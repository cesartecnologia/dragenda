import { createAsaasCheckoutSession, createAsaasPaymentLink } from '@/lib/asaas';
import {
  attachAsaasCheckoutToSession,
  attachAsaasPaymentLinkToSession,
  createCheckoutSession,
} from '@/server/checkout-sessions';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

export type PublicCheckoutMethod = 'credit_card' | 'boleto';

const getAppUrl = () => {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
  }

  return configured.replace(/\/$/, '');
};

export async function startPublicCheckout(paymentMethod: PublicCheckoutMethod) {
  const session = await createCheckoutSession({ paymentMethod });
  const appUrl = getAppUrl();
  const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;

  if (paymentMethod === 'boleto') {
    const paymentLink = await createAsaasPaymentLink({
      billingType: 'BOLETO',
      chargeType: 'DETACHED',
      dueDateLimitDays: 3,
      name: `${PLAN_LABEL} - primeira mensalidade`,
      description: 'Pague a primeira mensalidade e conclua o cadastro da clínica na sequência.',
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

    return {
      sessionId: session.id,
      checkoutId: paymentLink.id,
      checkoutUrl: paymentLink.url,
    };
  }

  const checkout = await createAsaasCheckoutSession({
    billingTypes: ['CREDIT_CARD'],
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
