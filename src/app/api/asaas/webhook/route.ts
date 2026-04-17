import { NextResponse } from 'next/server';

import { type DocumentData } from 'firebase-admin/firestore';

import { getFirestoreDb } from '@/lib/firebase-admin';
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
import { getSubscriptionSummaryForUser, type SubscriptionResolvedStatus } from '@/server/subscription-data';

const PLAN_NAME = 'essential';
const WEBHOOK_EVENTS_COLLECTION = 'asaasWebhookEvents';

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

const TERMINAL_STATUSES = new Set(['cancelled', 'deleted', 'inactive', 'refunded']);

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

const resolveWebhookEventId = (payload: Record<string, unknown>, event: string, resourceId?: string | null) => {
  const explicitId = typeof payload.id === 'string' ? payload.id.trim() : '';
  if (explicitId) return explicitId;

  const dateCreated = typeof payload.dateCreated === 'string' ? payload.dateCreated.trim() : '';
  return [event, resourceId ?? 'unknown', dateCreated || 'undated'].join(':');
};

const registerWebhookEvent = async (eventId: string, params: { event: string; resourceId?: string | null }) => {
  const ref = getFirestoreDb().collection(WEBHOOK_EVENTS_COLLECTION).doc(eventId);
  const snapshot = await ref.get();
  if (snapshot.exists) return false;

  await ref.set({
    id: eventId,
    event: params.event,
    resourceId: params.resourceId ?? null,
    createdAt: new Date(),
  } as DocumentData);

  return true;
};

const deriveFallbackStatus = (event: string, currentStatus?: string | null): SubscriptionResolvedStatus => {
  const normalizedCurrent = currentStatus?.trim().toLowerCase() ?? null;

  if (ACTIVATION_EVENTS.has(event)) return 'active';
  if (event === 'PAYMENT_OVERDUE') return 'overdue';
  if (event === 'PAYMENT_DELETED') return 'deleted';
  if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_CHARGEBACK_REQUESTED' || event === 'PAYMENT_RECEIVED_IN_CASH_UNDONE') {
    return 'refunded';
  }
  if (event === 'SUBSCRIPTION_DELETED') return 'cancelled';
  if (event === 'SUBSCRIPTION_INACTIVATED' || event === 'SUBSCRIPTION_SPLIT_DIVERGENCE_BLOCK') return 'inactive';

  if (TRACKING_EVENTS.has(event)) {
    if (normalizedCurrent === 'active') return 'active';
    if (normalizedCurrent === 'overdue') return 'overdue';
    if (normalizedCurrent === 'checkout_pending') return 'checkout_pending';
    if (normalizedCurrent === 'pending') return 'pending';
    return 'pending';
  }

  return normalizedCurrent as SubscriptionResolvedStatus;
};

const planForStatus = (status: SubscriptionResolvedStatus, currentPlan?: string | null) =>
  TERMINAL_STATUSES.has(status ?? '') ? null : currentPlan ?? PLAN_NAME;

const reconcileUserSubscription = async (params: {
  userId: string;
  event: string;
  currentPlan?: string | null;
  currentStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) => {
  const fallbackStatus = deriveFallbackStatus(params.event, params.currentStatus);

  try {
    const summary = await getSubscriptionSummaryForUser(params.userId);
    const nextStatus = summary.resolvedStatus ?? fallbackStatus;

    await updateUserAsaasSubscription(params.userId, {
      asaasCustomerId: params.customerId ?? summary.asaasCustomerId ?? undefined,
      asaasSubscriptionId: params.subscriptionId ?? summary.asaasSubscriptionId ?? undefined,
      subscriptionStatus: nextStatus,
      paidThroughDate: summary.paidThroughDate ?? undefined,
      plan: planForStatus(nextStatus, params.currentPlan),
    });
  } catch (error) {
    console.error('ASAAS_WEBHOOK_RECONCILE_FAILED', error);
    await updateUserAsaasSubscription(params.userId, {
      asaasCustomerId: params.customerId ?? undefined,
      asaasSubscriptionId: params.subscriptionId ?? undefined,
      subscriptionStatus: fallbackStatus,
      plan: planForStatus(fallbackStatus, params.currentPlan),
    });
  }
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

  const paymentId = typeof resource?.id === 'string' && event.startsWith('PAYMENT_') ? resource.id : null;
  const paymentStatus = typeof resource?.status === 'string' ? resource.status : null;
  const invoiceUrl = typeof resource?.invoiceUrl === 'string' ? resource.invoiceUrl : null;
  const billingType = typeof resource?.billingType === 'string' ? resource.billingType : null;
  const paymentValue = typeof resource?.value === 'number' ? resource.value : null;
  const paymentCheckoutId = typeof resource?.checkoutSession === 'string' ? resource.checkoutSession : checkoutId;
  const paymentLinkId = typeof resource?.paymentLink === 'string' ? resource.paymentLink : null;
  const externalReference = typeof resource?.externalReference === 'string' ? resource.externalReference : null;

  const customerId = typeof resource?.customer === 'string' ? resource.customer : null;
  const subscriptionId = typeof resource?.subscription === 'string'
    ? resource.subscription
    : typeof resource?.id === 'string' && event.startsWith('SUBSCRIPTION_')
      ? resource.id
      : null;

  const eventId = resolveWebhookEventId(payload, event, paymentId ?? subscriptionId ?? checkoutId);
  const shouldProcess = await registerWebhookEvent(eventId, {
    event,
    resourceId: paymentId ?? subscriptionId ?? checkoutId,
  }).catch(() => true);

  if (!shouldProcess) {
    return NextResponse.json({ received: true, duplicate: true });
  }

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

  const [checkoutSessionResult, pendingSignupResult] = await Promise.allSettled([
    event.startsWith('PAYMENT_') || event.startsWith('SUBSCRIPTION_')
      ? markCheckoutSessionFromPaymentWebhook({
          paymentId,
          paymentStatus,
          customerId,
          subscriptionId,
          checkoutSessionId: paymentCheckoutId,
          paymentLinkId,
          externalReference,
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

  if (TRACKING_EVENTS.has(event) || ACTIVATION_EVENTS.has(event) || DEACTIVATION_EVENTS.has(event) || SUBSCRIPTION_DEACTIVATION_EVENTS.has(event)) {
    await reconcileUserSubscription({
      userId: user.id,
      event,
      currentPlan: user.plan,
      currentStatus: user.subscriptionStatus,
      customerId,
      subscriptionId,
    });

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, ignored: true });
};
