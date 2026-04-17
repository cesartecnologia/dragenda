import { getAsaasSubscription, listAsaasSubscriptionPayments, listAsaasSubscriptions, type AsaasSubscription, type AsaasSubscriptionPayment } from '@/lib/asaas';
import { withServerCache } from '@/lib/server-cache';
import { getClinicById, getUserProfileById } from '@/server/clinic-data';

export type SubscriptionResolvedStatus =
  | 'active'
  | 'pending'
  | 'checkout_pending'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'deleted'
  | 'inactive'
  | null;

export type SubscriptionSummary = {
  clinicName: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  storedStatus: string | null;
  resolvedStatus: SubscriptionResolvedStatus;
  accessReleased: boolean;
  subscription: AsaasSubscription | null;
  payments: AsaasSubscriptionPayment[];
  latestPayment: AsaasSubscriptionPayment | null;
};

const ACTIVE_PAYMENT_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const PENDING_PAYMENT_STATUSES = new Set(['PENDING', 'AWAITING_RISK_ANALYSIS', 'RECEIVED_AWAITING_CLEARING']);
const OVERDUE_PAYMENT_STATUSES = new Set(['OVERDUE']);
const REFUNDED_PAYMENT_STATUSES = new Set(['REFUNDED']);
const DELETED_PAYMENT_STATUSES = new Set(['DELETED']);

const parseSortableDate = (payment: AsaasSubscriptionPayment) => {
  const candidate = payment.dueDate ?? payment.dateCreated;
  const time = candidate ? new Date(candidate).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const sortPayments = (payments: AsaasSubscriptionPayment[]) =>
  [...payments].sort((a, b) => parseSortableDate(b) - parseSortableDate(a));

const normalizeSubscriptionStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;
const normalizePaymentStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;

const findPaymentByStatus = (payments: AsaasSubscriptionPayment[], acceptedStatuses: Set<string>) =>
  payments.find((payment) => {
    const status = normalizePaymentStatus(payment.status);
    return Boolean(status && acceptedStatuses.has(status));
  }) ?? null;

const inferResolvedStatus = (params: {
  storedStatus?: string | null;
  subscription?: AsaasSubscription | null;
  payments?: AsaasSubscriptionPayment[];
}): SubscriptionResolvedStatus => {
  const subscriptionStatus = normalizeSubscriptionStatus(params.subscription?.status);
  const stored = params.storedStatus?.trim().toLowerCase() ?? null;
  const payments = params.payments ?? [];

  if (subscriptionStatus?.includes('REMOV') || subscriptionStatus?.includes('DELET')) return 'cancelled';
  if (subscriptionStatus?.includes('INACTIV')) return 'inactive';

  const latestSettledPayment = findPaymentByStatus(payments, ACTIVE_PAYMENT_STATUSES);
  if (latestSettledPayment) return 'active';

  const latestOverduePayment = findPaymentByStatus(payments, OVERDUE_PAYMENT_STATUSES);
  if (latestOverduePayment) return 'overdue';

  const latestRefundedPayment = findPaymentByStatus(payments, REFUNDED_PAYMENT_STATUSES);
  if (latestRefundedPayment) return 'refunded';

  const latestDeletedPayment = findPaymentByStatus(payments, DELETED_PAYMENT_STATUSES);
  if (latestDeletedPayment) return 'deleted';

  const latestPendingPayment = findPaymentByStatus(payments, PENDING_PAYMENT_STATUSES);
  if (latestPendingPayment) return 'pending';

  if (subscriptionStatus?.includes('ACTIVE')) return stored === 'active' ? 'active' : 'pending';

  if (stored === 'active') return 'active';
  if (stored === 'overdue') return 'overdue';
  if (stored === 'checkout_pending') return 'checkout_pending';
  if (stored === 'cancelled' || stored === 'inactive') return 'cancelled';
  if (stored === 'refunded') return 'refunded';
  if (stored === 'deleted') return 'deleted';
  if (stored === 'pending') return 'pending';

  return null;
};

export const getSubscriptionSummaryForUser = async (userId: string): Promise<SubscriptionSummary> => {
  return withServerCache(`subscription-summary:${userId}`, 45_000, async () => {
    const user = await getUserProfileById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const clinic = user.clinicId ? await getClinicById(user.clinicId) : null;
    const clinicName = clinic?.name ?? null;
    const asaasCustomerId = clinic?.asaasCustomerId ?? user.asaasCustomerId ?? null;
    const storedSubscriptionId = clinic?.asaasSubscriptionId ?? user.asaasSubscriptionId ?? null;
    const storedStatus = clinic?.subscriptionStatus ?? user.subscriptionStatus ?? null;

    let subscription: AsaasSubscription | null = null;
    let asaasSubscriptionId: string | null = storedSubscriptionId;

    try {
      if (storedSubscriptionId) {
        subscription = await getAsaasSubscription(storedSubscriptionId);
      } else if (asaasCustomerId) {
        const subscriptions = await listAsaasSubscriptions({ customer: asaasCustomerId, limit: 10 });
        const sortedSubscriptions = [...subscriptions].sort((a, b) => {
          const aTime = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
          const bTime = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
          return bTime - aTime;
        });
        subscription = sortedSubscriptions[0] ?? null;
        asaasSubscriptionId = subscription?.id ?? null;
      }
    } catch {
      subscription = null;
    }

    let payments: AsaasSubscriptionPayment[] = [];
    if (subscription?.id) {
      try {
        payments = await listAsaasSubscriptionPayments(subscription.id);
      } catch {
        payments = [];
      }
    }

    const sortedPayments = sortPayments(payments);
    const latestPayment = sortedPayments[0] ?? null;
    const resolvedStatus = inferResolvedStatus({
      storedStatus,
      subscription,
      payments: sortedPayments,
    });

    return {
      clinicName,
      asaasCustomerId,
      asaasSubscriptionId,
      storedStatus,
      resolvedStatus,
      accessReleased: resolvedStatus === 'active',
      subscription,
      payments: sortedPayments,
      latestPayment,
    };
  });
};
