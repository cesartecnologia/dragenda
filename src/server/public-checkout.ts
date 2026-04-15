import {
  createAsaasCheckoutSession,
  createAsaasCustomerMinimal,
  createAsaasPayment,
} from '@/lib/asaas';
import {
  attachAsaasCheckoutToSession,
  createCheckoutSession,
  updateCheckoutSession,
  upsertPaymentFromCheckoutSession,
} from '@/server/checkout-sessions';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

export type PublicCheckoutMethod = 'credit_card' | 'boleto';

export type PublicBoletoPayer = {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
};

const getAppUrl = () => {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
  }

  return configured.replace(/\/$/, '');
};

export async function startPublicCheckout(paymentMethod: PublicCheckoutMethod) {
  if (paymentMethod === 'boleto') {
    throw new Error('BOLETO_REQUIRES_PAYER_DATA');
  }

  const session = await createCheckoutSession({ paymentMethod });
  const appUrl = getAppUrl();
  const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;

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

const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');

export async function startPublicBoletoCheckout(payer: PublicBoletoPayer) {
  const session = await createCheckoutSession({ paymentMethod: 'boleto' });
  const appUrl = getAppUrl();
  const callbackBase = `${appUrl}/primeiro-acesso?sessionId=${encodeURIComponent(session.id)}`;

  const customer = await createAsaasCustomerMinimal({
    name: payer.name,
    email: payer.email,
    cpfCnpj: onlyDigits(payer.cpfCnpj),
    phone: onlyDigits(payer.phone),
    externalReference: session.id,
    notificationDisabled: false,
  });

  const payment = await createAsaasPayment({
    customerId: customer.id,
    billingType: 'BOLETO',
    value: PLAN_VALUE,
    description: `${PLAN_LABEL} - primeira mensalidade`,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    successUrl: callbackBase,
    autoRedirect: false,
    externalReference: session.id,
    daysAfterDueDateToRegistrationCancellation: 1,
  });

  const invoiceUrl = payment.invoiceUrl ?? payment.bankSlipUrl ?? null;

  await updateCheckoutSession(session.id, {
    status: 'waiting_payment',
    asaasCustomerId: customer.id,
    paymentId: payment.id,
    paymentStatus: payment.status ?? 'PENDING',
    invoiceUrl,
    checkoutUrl: invoiceUrl,
    payerName: customer.name ?? payer.name,
    payerEmail: customer.email ?? payer.email,
    payerPhone: customer.mobilePhone ?? customer.phone ?? payer.phone,
    payerCpfCnpj: customer.cpfCnpj ?? onlyDigits(payer.cpfCnpj),
  });

  await upsertPaymentFromCheckoutSession({
    sessionId: session.id,
    asaasPaymentId: payment.id,
    status: payment.status ?? 'PENDING',
    method: 'boleto',
    value: payment.value ?? PLAN_VALUE,
    invoiceUrl,
    asaasCustomerId: customer.id,
  });

  return {
    sessionId: session.id,
    paymentId: payment.id,
    checkoutUrl: invoiceUrl,
    invoiceUrl,
  };
}
