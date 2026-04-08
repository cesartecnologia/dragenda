import { NextResponse } from 'next/server';

import {
  findUserProfileByAsaasCustomerId,
  findUserProfileByAsaasSubscriptionId,
  updateUserAsaasSubscription,
} from '@/server/clinic-data';

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
  const customerId = typeof resource?.customer === 'string' ? resource.customer : null;
  const subscriptionId = typeof resource?.subscription === 'string'
    ? resource.subscription
    : typeof resource?.id === 'string' && event.startsWith('SUBSCRIPTION_')
      ? resource.id
      : null;

  const user =
    (subscriptionId ? await findUserProfileByAsaasSubscriptionId(subscriptionId) : null) ??
    (customerId ? await findUserProfileByAsaasCustomerId(customerId) : null);

  if (!user) return NextResponse.json({ received: true, ignored: true });

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
