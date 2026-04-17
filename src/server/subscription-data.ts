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
  paidThroughDate: Date | null;
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
const SUBSCRIPTION_OVERDUE_GRACE_DAYS = Number(process.env.SUBSCRIPTION_OVERDUE_GRACE_DAYS ?? '3');

const normalizeSubscriptionStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;
const normalizePaymentStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;
const normalizeStoredStatus = (value?: string | null) => value?.trim().toLowerCase() ?? null;
const normalizeCycle = (value?: string | null) => value?.trim().toUpperCase() ?? 'MONTHLY';

const parseAsaasDate = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return Number.isFinite(date.getTime()) ? date : null;
  }

  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const addCycle = (date: Date, cycle?: string | null) => {
  const next = new Date(date.getTime());
  switch (normalizeCycle(cycle)) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'BIMONTHLY':
      next.setMonth(next.getMonth() + 2);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'SEMIANNUALLY':
      next.setMonth(next.getMonth() + 6);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'MONTHLY':
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
};

const parseSortableDate = (payment: AsaasSubscriptionPayment) => {
  const candidate = parseAsaasDate(payment.dueDate) ?? parseAsaasDate(payment.dateCreated);
  return candidate ? candidate.getTime() : 0;
};

const sortPayments = (payments: AsaasSubscriptionPayment[]) =>
  [...payments].sort((a, b) => parseSortableDate(b) - parseSortableDate(a));

const countPaymentsByStatuses = (payments: AsaasSubscriptionPayment[], acceptedStatuses: Set<string>) =>
  payments.reduce((total, payment) => {
    const status = normalizePaymentStatus(payment.status);
    return total + (status && acceptedStatuses.has(status) ? 1 : 0);
  }, 0);

const firstPaymentByStatuses = (payments: AsaasSubscriptionPayment[], acceptedStatuses: Set<string>) =>
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
  const stored = normalizeStoredStatus(params.storedStatus);
  const payments = params.payments ?? [];

  const paidCount = countPaymentsByStatuses(payments, ACTIVE_PAYMENT_STATUSES);
  const pendingCount = countPaymentsByStatuses(payments, PENDING_PAYMENT_STATUSES);
  const overdueCount = countPaymentsByStatuses(payments, OVERDUE_PAYMENT_STATUSES);
  const refundedCount = countPaymentsByStatuses(payments, REFUNDED_PAYMENT_STATUSES);
  const deletedCount = countPaymentsByStatuses(payments, DELETED_PAYMENT_STATUSES);

  const latestPaid = firstPaymentByStatuses(payments, ACTIVE_PAYMENT_STATUSES);
  const latestOverdue = firstPaymentByStatuses(payments, OVERDUE_PAYMENT_STATUSES);

  if (subscriptionStatus?.includes('REMOV') || subscriptionStatus?.includes('DELET')) {
    return paidCount > 0 ? 'active' : 'cancelled';
  }

  if (subscriptionStatus?.includes('INACTIV') || subscriptionStatus?.includes('EXPIRED')) {
    return paidCount > 0 ? 'active' : 'inactive';
  }

  if (paidCount > 0) {
    if (latestOverdue && parseSortableDate(latestOverdue) >= parseSortableDate(latestPaid ?? latestOverdue)) {
      return 'overdue';
    }

    if (refundedCount > 0 && parseSortableDate(firstPaymentByStatuses(payments, REFUNDED_PAYMENT_STATUSES) ?? payments[0]) > parseSortableDate(latestPaid ?? payments[0])) {
      return 'refunded';
    }

    if (deletedCount > 0 && parseSortableDate(firstPaymentByStatuses(payments, DELETED_PAYMENT_STATUSES) ?? payments[0]) > parseSortableDate(latestPaid ?? payments[0])) {
      return 'deleted';
    }

    return 'active';
  }

  if (overdueCount > 0) return 'overdue';
  if (refundedCount > 0) return 'refunded';
  if (deletedCount > 0) return 'deleted';
  if (subscriptionStatus === 'ACTIVE' || pendingCount > 0) return 'pending';

  if (stored === 'active') return 'active';
  if (stored === 'overdue') return 'overdue';
  if (stored === 'checkout_pending') return 'checkout_pending';
  if (stored === 'cancelled') return 'cancelled';
  if (stored === 'inactive') return 'inactive';
  if (stored === 'refunded') return 'refunded';
  if (stored === 'deleted') return 'deleted';
  if (stored === 'pending') return 'pending';

  return null;
};

type Candidate = {
  subscription: AsaasSubscription;
  payments: AsaasSubscriptionPayment[];
  resolvedStatus: SubscriptionResolvedStatus;
  paidThroughDate: Date | null;
  accessReleased: boolean;
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
    const aTime = parseAsaasDate(a.dateCreated)?.getTime() ?? 0;
    const bTime = parseAsaasDate(b.dateCreated)?.getTime() ?? 0;
    return bTime - aTime;
  });

const inferPaidThroughDate = (params: {
  subscription: AsaasSubscription | null;
  payments: AsaasSubscriptionPayment[];
  resolvedStatus: SubscriptionResolvedStatus;
}) => {
  const latestPaid = firstPaymentByStatuses(params.payments, ACTIVE_PAYMENT_STATUSES);
  const latestOverdue = firstPaymentByStatuses(params.payments, OVERDUE_PAYMENT_STATUSES);
  const nextDueDate = parseAsaasDate(params.subscription?.nextDueDate);

  if (params.resolvedStatus === 'active') {
    if (nextDueDate) return nextDueDate;
    const latestPaidDueDate = parseAsaasDate(latestPaid?.dueDate);
    return latestPaidDueDate ? addCycle(latestPaidDueDate, params.subscription?.cycle) : null;
  }

  if (params.resolvedStatus === 'overdue') {
    return parseAsaasDate(latestOverdue?.dueDate) ?? nextDueDate ?? null;
  }

  if (params.resolvedStatus === 'pending' && latestPaid) {
    if (nextDueDate) return nextDueDate;
    const latestPaidDueDate = parseAsaasDate(latestPaid.dueDate);
    return latestPaidDueDate ? addCycle(latestPaidDueDate, params.subscription?.cycle) : null;
  }

  return null;
};

const hasAccessByResolvedStatus = (resolvedStatus: SubscriptionResolvedStatus, paidThroughDate: Date | null) => {
  if (resolvedStatus === 'active') return true;
  if (resolvedStatus === 'overdue' && paidThroughDate) {
    const graceUntil = paidThroughDate.getTime() + SUBSCRIPTION_OVERDUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() <= graceUntil;
  }
  return false;
};

const subscriptionScore = (candidate: Candidate, storedSubscriptionId?: string | null) => {
  const subscriptionStatus = normalizeSubscriptionStatus(candidate.subscription.status);
  const paidCount = countPaymentsByStatuses(candidate.payments, ACTIVE_PAYMENT_STATUSES);
  const pendingCount = countPaymentsByStatuses(candidate.payments, PENDING_PAYMENT_STATUSES);
  const overdueCount = countPaymentsByStatuses(candidate.payments, OVERDUE_PAYMENT_STATUSES);
  const createdAt = parseAsaasDate(candidate.subscription.dateCreated)?.getTime() ?? 0;

  let score = 0;
  if (candidate.subscription.id === storedSubscriptionId) score += 20;
  if (candidate.accessReleased) score += 1500;
  if (paidCount > 0) score += 1000;
  if (subscriptionStatus === 'ACTIVE') score += 300;
  if (pendingCount > 0) score += 120;
  if (candidate.resolvedStatus === 'active') score += 800;
  if (candidate.resolvedStatus === 'overdue') score += candidate.accessReleased ? 250 : -150;
  if (candidate.resolvedStatus === 'pending') score += 80;
  if (subscriptionStatus === 'INACTIVE' || subscriptionStatus === 'EXPIRED') score -= 300;
  if (overdueCount > 0 && paidCount === 0) score -= 50;
  score += createdAt / 1_000_000_000_000;

  return score;
};

const loadCandidate = async (subscription: AsaasSubscription, storedStatus: string | null): Promise<Candidate> => {
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
  const paidThroughDate = inferPaidThroughDate({
    subscription,
    payments: sortedPayments,
    resolvedStatus,
  });

  return {
    subscription,
    payments: sortedPayments,
    resolvedStatus,
    paidThroughDate,
    accessReleased: hasAccessByResolvedStatus(resolvedStatus, paidThroughDate),
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
        // ignore and recover by customer below
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
    let paidThroughDate: Date | null = clinic?.paidThroughDate ?? user.paidThroughDate ?? null;
    let accessReleased = hasAccessByResolvedStatus(normalizeStoredStatus(storedStatus) as SubscriptionResolvedStatus, paidThroughDate);

    if (subscriptions.length > 0) {
      const candidates = await Promise.all(subscriptions.map((item) => loadCandidate(item, storedStatus)));
      const bestCandidate = [...candidates].sort((a, b) => subscriptionScore(b, storedSubscriptionId) - subscriptionScore(a, storedSubscriptionId))[0];

      subscription = bestCandidate?.subscription ?? null;
      payments = bestCandidate?.payments ?? [];
      resolvedStatus = bestCandidate?.resolvedStatus ?? null;
      paidThroughDate = bestCandidate?.paidThroughDate ?? paidThroughDate;
      accessReleased = bestCandidate?.accessReleased ?? accessReleased;
    } else {
      resolvedStatus = inferResolvedStatus({ storedStatus, subscription: null, payments: [] });
      accessReleased = hasAccessByResolvedStatus(resolvedStatus, paidThroughDate);
    }

    const latestPayment = payments[0] ?? null;
    const resolvedSubscriptionId = subscription?.id ?? storedSubscriptionId ?? null;

    return {
      clinicName,
      asaasCustomerId,
      asaasSubscriptionId: resolvedSubscriptionId,
      storedStatus,
      resolvedStatus,
      accessReleased,
      paidThroughDate,
      subscription,
      payments,
      latestPayment,
    };
  });
};
