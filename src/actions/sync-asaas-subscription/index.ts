'use server';

import { requireSession } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import { updateUserAsaasSubscription } from '@/server/clinic-data';
import { getSubscriptionSummaryForUser } from '@/server/subscription-data';

const PLAN_NAME = 'essential';

export const syncAsaasSubscription = actionClient.action(async () => {
  const session = await requireSession();
  const summary = await getSubscriptionSummaryForUser(session.user.id);

  await updateUserAsaasSubscription(session.user.id, {
    asaasCustomerId: summary.asaasCustomerId ?? undefined,
    asaasSubscriptionId: summary.asaasSubscriptionId ?? undefined,
    subscriptionStatus: summary.resolvedStatus,
    plan: summary.accessReleased ? PLAN_NAME : null,
  });

  return {
    status: summary.resolvedStatus,
    accessReleased: summary.accessReleased,
    subscriptionId: summary.asaasSubscriptionId,
    customerId: summary.asaasCustomerId,
    paymentsFound: summary.payments.length,
  };
});
