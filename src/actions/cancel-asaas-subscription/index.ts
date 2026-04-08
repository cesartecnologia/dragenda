'use server';

import { requireSession } from '@/lib/auth';
import { deleteAsaasSubscription } from '@/lib/asaas';
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

  await deleteAsaasSubscription(summary.asaasSubscriptionId);

  await updateUserAsaasSubscription(session.user.id, {
    asaasCustomerId: summary.asaasCustomerId ?? undefined,
    asaasSubscriptionId: summary.asaasSubscriptionId,
    subscriptionStatus: 'cancelled',
    plan: null,
  });

  return {
    subscriptionId: summary.asaasSubscriptionId,
    status: 'cancelled',
  };
});
