import { NextResponse } from 'next/server';

import {
  findUserProfileByAsaasCustomerId,
  findUserProfileByAsaasSubscriptionId,
  updateUserAsaasSubscription,
} from '@/server/clinic-data';
import {
  markCheckoutSessionFromCheckoutWebhook,
  markCheckoutSessionFromPaymentWebhook,
} from '@/server/checkout-sessions';
import { markPendingSignupFromCheckoutWebhook, markPendingSignupFromPaymentWebhook } from '@/server/pending-signups';

const PLAN_NAME = 'essential';

const ACTIVATION_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RESTORED']);
const DEACTIVATION_EVENTS = new Set([
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',
]);
const TRACKING_EVENTS = new Set(['PAYMENT_CREATED', 'PAYMENT_UPDATED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED']);
const SUBSCRIPTION_DEACTIVATION_EVENTS = new Set([
  'SUBSCRIPTION_INACTIVATED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK',
]);

const extractResource = (payload: Record<string, unknown>) => {
  const candidates = [
    payload.payment,
    payload.subscription,
    payload.data,
    payload?.data && (payload.data as Record<string, unknown>).payment,
    payload?.data && (payload.data as Record<string, unknown>).subscription,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') return candidate as Record<string, unknown>;
  }

  if (payload.customer || payload.subscription) return payload;
  return null;
};

export const POST = async (request: Request) => {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  const receivedToken = request.headers.get('asaas-access-token')?.trim();

  if (expectedToken && receivedToken !== expectedToken) {
    return NextResponse.json({ error: 'invalid webhook token' }, { status: 401 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const event = typeof payload.event === 'string' ? payload.event : null;
  if (!event) return NextResponse.json({ received: false, ignored: true });

  const resource = extractResource(payload);
  const checkoutResource = typeof payload.checkout === 'object' && payload.checkout ? (payload.checkout as Record<string, unknown>) : null;
  const checkoutId = typeof checkoutResource?.id === 'string' ? checkoutResource.id : null;
  const checkoutStatus = typeof checkoutResource?.status === 'string' ? checkoutResource.status : null;
  const checkoutCustomerId = typeof checkoutResource?.customer === 'string' ? checkoutResource.customer : null;
  const checkoutSubscriptionId = typeof checkoutResource?.subscription === 'string' ? checkoutResource.subscription : null;

  if (event.startsWith('CHECKOUT_') && checkoutId) {
    await Promise.allSettled([
      markCheckoutSessionFromCheckoutWebhook({
        checkoutId,
        checkoutStatus,
        customerId: checkoutCustomerId,
        subscriptionId: checkoutSubscriptionId,
      }),
      markPendingSignupFromCheckoutWebhook({
        checkoutId,
        checkoutStatus,
        customerId: checkoutCustomerId,
        subscriptionId: checkoutSubscriptionId,
      }),
    ]);

    return NextResponse.json({ received: true });
  }

  const paymentId = typeof resource?.id === 'string' && event.startsWith('PAYMENT_') ? resource.id : null;
  const paymentStatus = typeof resource?.status === 'string' ? resource.status : null;
  const invoiceUrl = typeof resource?.invoiceUrl === 'string' ? resource.invoiceUrl : null;
  const billingType = typeof resource?.billingType === 'string' ? resource.billingType : null;
  const paymentValue = typeof resource?.value === 'number' ? resource.value : null;
  const paymentCheckoutId = typeof resource?.checkoutSession === 'string' ? resource.checkoutSession : checkoutId;

  const customerId = typeof resource?.customer === 'string' ? resource.customer : null;
  const subscriptionId = typeof resource?.subscription === 'string'
    ? resource.subscription
    : typeof resource?.id === 'string' && event.startsWith('SUBSCRIPTION_')
      ? resource.id
      : null;

  const [checkoutSessionResult, pendingSignupResult] = await Promise.allSettled([
    event.startsWith('PAYMENT_') || event.startsWith('SUBSCRIPTION_')
      ? markCheckoutSessionFromPaymentWebhook({
          paymentId,
          paymentStatus,
          customerId,
          subscriptionId,
          checkoutSessionId: paymentCheckoutId,
          invoiceUrl,
          billingType,
          value: paymentValue,
        })
      : Promise.resolve(null),
    event.startsWith('PAYMENT_') || event.startsWith('SUBSCRIPTION_')
      ? markPendingSignupFromPaymentWebhook({
          paymentId,
          paymentStatus,
          customerId,
          subscriptionId,
          invoiceUrl,
        })
      : Promise.resolve(null),
  ]);

  const pendingSignup = pendingSignupResult.status === 'fulfilled' ? pendingSignupResult.value : null;

  const user =
    (subscriptionId ? await findUserProfileByAsaasSubscriptionId(subscriptionId) : null) ??
    (customerId ? await findUserProfileByAsaasCustomerId(customerId) : null);

  if (!user) {
    return NextResponse.json({
      received: true,
      ignored: !pendingSignup && checkoutSessionResult.status !== 'fulfilled',
    });
  }

  if (TRACKING_EVENTS.has(event)) {
    await updateUserAsaasSubscription(user.id, {
      asaasCustomerId: customerId ?? undefined,
      asaasSubscriptionId: subscriptionId ?? undefined,
      subscriptionStatus:
        event === 'PAYMENT_CREATED'
          ? 'pending'
          : event === 'SUBSCRIPTION_CREATED'
            ? 'pending'
            : user.subscriptionStatus ?? 'pending',
    });

    return NextResponse.json({ received: true });
  }

  if (ACTIVATION_EVENTS.has(event)) {
    await updateUserAsaasSubscription(user.id, {
      asaasCustomerId: customerId ?? undefined,
      asaasSubscriptionId: subscriptionId ?? undefined,
      subscriptionStatus: 'active',
      plan: PLAN_NAME,
    });

    return NextResponse.json({ received: true });
  }

  if (DEACTIVATION_EVENTS.has(event)) {
    const statusByEvent: Record<string, string> = {
      PAYMENT_OVERDUE: 'overdue',
      PAYMENT_DELETED: 'deleted',
      PAYMENT_REFUNDED: 'refunded',
      PAYMENT_CHARGEBACK_REQUESTED: 'chargeback',
      PAYMENT_RECEIVED_IN_CASH_UNDONE: 'reverted',
    };

    await updateUserAsaasSubscription(user.id, {
      asaasCustomerId: customerId ?? undefined,
      asaasSubscriptionId: subscriptionId ?? undefined,
      subscriptionStatus: statusByEvent[event] ?? 'inactive',
      plan: null,
    });

    return NextResponse.json({ received: true });
  }

  if (SUBSCRIPTION_DEACTIVATION_EVENTS.has(event)) {
    await updateUserAsaasSubscription(user.id, {
      asaasCustomerId: customerId ?? undefined,
      asaasSubscriptionId: subscriptionId ?? undefined,
      subscriptionStatus: event === 'SUBSCRIPTION_DELETED' ? 'cancelled' : 'inactive',
      plan: null,
    });

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, ignored: true });
};
