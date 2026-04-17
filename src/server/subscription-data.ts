import {
  getAsaasSubscription,
  listAsaasSubscriptionPayments,
  listAsaasSubscriptions,
  type AsaasSubscription,
  type AsaasSubscriptionPayment,
} from '@/lib/asaas';
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

const ACTIVE_PAYMENT_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'PAID']);
const PENDING_PAYMENT_STATUSES = new Set([
  'PENDING',
  'AWAITING_RISK_ANALYSIS',
  'RECEIVED_AWAITING_CLEARING',
  'BANK_PROCESSING',
  'AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST',
]);
const OVERDUE_PAYMENT_STATUSES = new Set(['OVERDUE']);
const REFUNDED_PAYMENT_STATUSES = new Set(['REFUNDED']);
const DELETED_PAYMENT_STATUSES = new Set(['DELETED']);

const normalizeSubscriptionStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;
const normalizePaymentStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;

const parseSortableDate = (payment: AsaasSubscriptionPayment) => {
  const candidate = payment.dueDate ?? payment.dateCreated;
  const time = candidate ? new Date(candidate).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const sortPayments = (payments: AsaasSubscriptionPayment[]) =>
  [...payments].sort((a, b) => parseSortableDate(b) - parseSortableDate(a));

const countPaymentsByStatuses = (payments: AsaasSubscriptionPayment[], acceptedStatuses: Set<string>) =>
  payments.reduce((total, payment) => {
    const status = normalizePaymentStatus(payment.status);
    return total + (status && acceptedStatuses.has(status) ? 1 : 0);
  }, 0);

const inferResolvedStatus = (params: {
  storedStatus?: string | null;
  subscription?: AsaasSubscription | null;
  payments?: AsaasSubscriptionPayment[];
}): SubscriptionResolvedStatus => {
  const subscriptionStatus = normalizeSubscriptionStatus(params.subscription?.status);
  const stored = params.storedStatus?.trim().toLowerCase() ?? null;
  const payments = params.payments ?? [];

  const paidCount = countPaymentsByStatuses(payments, ACTIVE_PAYMENT_STATUSES);
  const pendingCount = countPaymentsByStatuses(payments, PENDING_PAYMENT_STATUSES);
  const overdueCount = countPaymentsByStatuses(payments, OVERDUE_PAYMENT_STATUSES);
  const refundedCount = countPaymentsByStatuses(payments, REFUNDED_PAYMENT_STATUSES);
  const deletedCount = countPaymentsByStatuses(payments, DELETED_PAYMENT_STATUSES);

  if (paidCount > 0) return 'active';
  if (subscriptionStatus?.includes('REMOV') || subscriptionStatus?.includes('DELET')) return 'cancelled';
  if (subscriptionStatus?.includes('INACTIV') || subscriptionStatus?.includes('EXPIRED')) return 'inactive';

  // Important: Asaas subscriptions can have more than one charge generated at the same time.
  // If there is an ACTIVE subscription with pending future charges, do not let an older overdue charge
  // take precedence over the current subscription state.
  if (subscriptionStatus === 'ACTIVE' && pendingCount > 0) return 'pending';
  if (subscriptionStatus === 'ACTIVE' && overdueCount > 0) return stored === 'active' ? 'active' : 'overdue';
  if (subscriptionStatus === 'ACTIVE') return stored === 'active' ? 'active' : 'pending';

  if (overdueCount > 0) return 'overdue';
  if (refundedCount > 0) return 'refunded';
  if (deletedCount > 0) return 'deleted';
  if (pendingCount > 0) return 'pending';

  if (stored === 'active') return 'active';
  if (stored === 'overdue') return 'overdue';
  if (stored === 'checkout_pending') return 'checkout_pending';
  if (stored === 'cancelled' || stored === 'inactive') return 'cancelled';
  if (stored === 'refunded') return 'refunded';
  if (stored === 'deleted') return 'deleted';
  if (stored === 'pending') return 'pending';

  return null;
};

type Candidate = {
  subscription: AsaasSubscription;
  payments: AsaasSubscriptionPayment[];
  resolvedStatus: SubscriptionResolvedStatus;
};

const uniqueSubscriptions = (subscriptions: AsaasSubscription[]) => {
  const seen = new Set<string>();
  const result: AsaasSubscription[] = [];

  for (const subscription of subscriptions) {
    if (!subscription?.id || seen.has(subscription.id)) continue;
    seen.add(subscription.id);
    result.push(subscription);
  }

  return result;
};

const sortSubscriptions = (subscriptions: AsaasSubscription[]) =>
  [...subscriptions].sort((a, b) => {
    const aTime = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
    const bTime = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
    return bTime - aTime;
  });

const subscriptionScore = (candidate: Candidate, storedSubscriptionId?: string | null) => {
  const subscriptionStatus = normalizeSubscriptionStatus(candidate.subscription.status);
  const paidCount = countPaymentsByStatuses(candidate.payments, ACTIVE_PAYMENT_STATUSES);
  const pendingCount = countPaymentsByStatuses(candidate.payments, PENDING_PAYMENT_STATUSES);
  const overdueCount = countPaymentsByStatuses(candidate.payments, OVERDUE_PAYMENT_STATUSES);
  const createdAt = candidate.subscription.dateCreated ? new Date(candidate.subscription.dateCreated).getTime() : 0;

  let score = 0;
  if (candidate.subscription.id === storedSubscriptionId) score += 20;
  if (paidCount > 0) score += 1000;
  if (subscriptionStatus === 'ACTIVE') score += 300;
  if (pendingCount > 0) score += 120;
  if (candidate.resolvedStatus === 'active') score += 800;
  if (candidate.resolvedStatus === 'pending') score += 80;
  if (candidate.resolvedStatus === 'overdue') score -= 150;
  if (subscriptionStatus === 'INACTIVE' || subscriptionStatus === 'EXPIRED') score -= 300;
  if (overdueCount > 0 && paidCount === 0) score -= 50;
  score += createdAt / 1_000_000_000_000;

  return score;
};

const loadCandidate = async (
  subscription: AsaasSubscription,
  storedStatus: string | null,
): Promise<Candidate> => {
  let payments: AsaasSubscriptionPayment[] = [];

  try {
    payments = await listAsaasSubscriptionPayments(subscription.id);
  } catch {
    payments = [];
  }

  const sortedPayments = sortPayments(payments);
  const resolvedStatus = inferResolvedStatus({
    storedStatus,
    subscription,
    payments: sortedPayments,
  });

  return {
    subscription,
    payments: sortedPayments,
    resolvedStatus,
  };
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

    const fetchedSubscriptions: AsaasSubscription[] = [];

    if (storedSubscriptionId) {
      try {
        const storedSubscription = await getAsaasSubscription(storedSubscriptionId);
        if (storedSubscription?.id) fetchedSubscriptions.push(storedSubscription);
      } catch {
        // ignore and keep going; we'll try to recover by customer below
      }
    }

    if (asaasCustomerId) {
      try {
        const subscriptions = await listAsaasSubscriptions({ customer: asaasCustomerId, limit: 20 });
        fetchedSubscriptions.push(...subscriptions);
      } catch {
        // ignore
      }
    }

    const subscriptions = sortSubscriptions(uniqueSubscriptions(fetchedSubscriptions));

    let subscription: AsaasSubscription | null = subscriptions[0] ?? null;
    let payments: AsaasSubscriptionPayment[] = [];
    let resolvedStatus: SubscriptionResolvedStatus = null;

    if (subscriptions.length > 0) {
      const candidates = await Promise.all(subscriptions.map((item) => loadCandidate(item, storedStatus)));
      const bestCandidate = [...candidates].sort((a, b) => {
        return subscriptionScore(b, storedSubscriptionId) - subscriptionScore(a, storedSubscriptionId);
      })[0];

      subscription = bestCandidate?.subscription ?? null;
      payments = bestCandidate?.payments ?? [];
      resolvedStatus = bestCandidate?.resolvedStatus ?? null;
    } else {
      resolvedStatus = inferResolvedStatus({ storedStatus, subscription: null, payments: [] });
    }

    const latestPayment = payments[0] ?? null;
    const resolvedSubscriptionId = subscription?.id ?? storedSubscriptionId ?? null;

    return {
      clinicName,
      asaasCustomerId,
      asaasSubscriptionId: resolvedSubscriptionId,
      storedStatus,
      resolvedStatus,
      accessReleased: resolvedStatus === 'active',
      subscription,
      payments,
      latestPayment,
    };
  });
};
