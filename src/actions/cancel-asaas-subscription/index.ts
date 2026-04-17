'use server';

import { requireSession } from '@/lib/auth';
import { updateAsaasSubscription } from '@/lib/asaas';
import { actionClient } from '@/lib/next-safe-action';
import { updateUserAsaasSubscription } from '@/server/clinic-data';
import { getSubscriptionSummaryForUser } from '@/server/subscription-data';

export const cancelAsaasSubscription = actionClient.action(async () => {
  const session = await requireSession();

  if (session.user.bypassSubscription) {
    throw new Error('Seu perfil não exige assinatura comercial.');
  }

  const summary = await getSubscriptionSummaryForUser(session.user.id);
  if (!summary.asaasSubscriptionId) {
    throw new Error('Nenhuma assinatura vinculada foi encontrada para cancelar.');
  }

  const endDate = summary.paidThroughDate ?? (summary.subscription?.nextDueDate ? new Date(summary.subscription.nextDueDate) : null);

  await updateAsaasSubscription(summary.asaasSubscriptionId, {
    endDate,
    updatePendingPayments: true,
  });

  await updateUserAsaasSubscription(session.user.id, {
    asaasCustomerId: summary.asaasCustomerId ?? undefined,
    asaasSubscriptionId: summary.asaasSubscriptionId,
    subscriptionStatus: summary.resolvedStatus ?? 'active',
    paidThroughDate: endDate ?? summary.paidThroughDate ?? undefined,
    plan: session.user.plan ?? 'essential',
  });

  return {
    subscriptionId: summary.asaasSubscriptionId,
    status: 'scheduled_cancellation',
    endDate: endDate?.toISOString() ?? null,
  };
});
