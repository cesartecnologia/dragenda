import { randomUUID } from 'crypto';

import { Timestamp, type DocumentData, type DocumentSnapshot, type QuerySnapshot } from 'firebase-admin/firestore';

import { checkoutSessionsTable, onboardingTable, paymentsTable } from '@/db/schema';
import {
  getAsaasCustomer,
  listAsaasPayments,
  listAsaasSubscriptionPayments,
  type AsaasCustomer,
  type AsaasPayment,
  type AsaasSubscriptionPayment,
} from '@/lib/asaas';
import { getFirestoreDb } from '@/lib/firebase-admin';

type CheckoutSession = typeof checkoutSessionsTable.$inferSelect;
type Payment = typeof paymentsTable.$inferSelect;
type Onboarding = typeof onboardingTable.$inferSelect;

const COLLECTIONS = {
  checkoutSessions: 'checkoutSessions',
  payments: 'payments',
  onboarding: 'onboarding',
} as const;

const ACTIVE_PAYMENT_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const PENDING_PAYMENT_STATUSES = new Set(['PENDING', 'AWAITING_RISK_ANALYSIS', 'RECEIVED_AWAITING_CLEARING']);
const EXPIRED_PAYMENT_STATUSES = new Set(['OVERDUE']);
const CANCELLED_PAYMENT_STATUSES = new Set(['DELETED', 'REFUNDED', 'CHARGEBACK_REQUESTED', 'RECEIVED_IN_CASH_UNDONE']);

const isTimestamp = (value: unknown): value is Timestamp => value instanceof Timestamp;

const normalizeFirestoreValue = <T,>(value: T): T => {
  if (isTimestamp(value)) return value.toDate() as T;
  if (Array.isArray(value)) return value.map((item) => normalizeFirestoreValue(item)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeFirestoreValue(item)]),
    ) as T;
  }
  return value;
};

const sanitizeFirestoreValue = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => sanitizeFirestoreValue(item));
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Timestamp)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, sanitizeFirestoreValue(item)]),
    );
  }
  return value;
};

const fromDoc = <T,>(snapshot: DocumentSnapshot): T | null => {
  if (!snapshot.exists) return null;
  return normalizeFirestoreValue(snapshot.data() as T);
};

const fromQuery = <T,>(snapshot: QuerySnapshot): T[] => {
  return snapshot.docs
    .map((docSnapshot) => fromDoc<T>(docSnapshot))
    .filter((item): item is T => Boolean(item));
};

const normalizeStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;

const toCheckoutSession = (base: Partial<CheckoutSession> = {}): CheckoutSession => {
  const now = new Date();
  return {
    id: base.id ?? randomUUID(),
    planId: base.planId ?? 'essential',
    planName: base.planName ?? 'Plano Premium',
    value: base.value ?? Number(process.env.ASAAS_PLAN_VALUE ?? '99.90'),
    status: base.status ?? 'initiated',
    paymentMethod: base.paymentMethod ?? 'credit_card',
    paymentId: base.paymentId ?? null,
    paymentStatus: base.paymentStatus ?? null,
    checkoutId: base.checkoutId ?? null,
    asaasCustomerId: base.asaasCustomerId ?? null,
    asaasSubscriptionId: base.asaasSubscriptionId ?? null,
    customerName: base.customerName ?? null,
    companyName: base.companyName ?? null,
    customerEmail: base.customerEmail ?? null,
    customerPhone: base.customerPhone ?? null,
    customerCpfCnpj: base.customerCpfCnpj ?? null,
    customerAddress: base.customerAddress ?? null,
    customerAddressNumber: base.customerAddressNumber ?? null,
    customerAddressComplement: base.customerAddressComplement ?? null,
    customerPostalCode: base.customerPostalCode ?? null,
    customerProvince: base.customerProvince ?? null,
    invoiceUrl: base.invoiceUrl ?? null,
    createdAt: base.createdAt ?? now,
    updatedAt: base.updatedAt ?? now,
    paidAt: base.paidAt ?? null,
  };
};

const toPayment = (base: Partial<Payment> & { sessionId: string; method: Payment['method']; value: number }): Payment => {
  const now = new Date();
  return {
    id: base.id ?? base.asaasPaymentId ?? randomUUID(),
    sessionId: base.sessionId,
    asaasPaymentId: base.asaasPaymentId ?? null,
    status: base.status ?? 'PENDING',
    method: base.method,
    value: base.value,
    invoiceUrl: base.invoiceUrl ?? null,
    createdAt: base.createdAt ?? now,
    updatedAt: base.updatedAt ?? now,
    confirmedAt: base.confirmedAt ?? null,
  };
};

const toOnboarding = (base: Partial<Onboarding> & { sessionId: string }): Onboarding => {
  const now = new Date();
  return {
    id: base.id ?? base.sessionId,
    sessionId: base.sessionId,
    status: base.status ?? 'locked',
    releasedAt: base.releasedAt ?? null,
    completedAt: base.completedAt ?? null,
    userId: base.userId ?? null,
    clinicId: base.clinicId ?? null,
    createdAt: base.createdAt ?? now,
    updatedAt: base.updatedAt ?? now,
  };
};

const getCheckoutSessionRef = (id: string) => getFirestoreDb().collection(COLLECTIONS.checkoutSessions).doc(id);
const getOnboardingRef = (sessionId: string) => getFirestoreDb().collection(COLLECTIONS.onboarding).doc(sessionId);
const getPaymentRef = (id: string) => getFirestoreDb().collection(COLLECTIONS.payments).doc(id);

export const createCheckoutSession = async (base: Partial<CheckoutSession> = {}) => {
  const session = toCheckoutSession(base);
  const onboarding = toOnboarding({
    sessionId: session.id,
    status: session.status === 'paid' ? 'released' : 'locked',
    releasedAt: session.status === 'paid' ? new Date() : null,
  });

  const batch = getFirestoreDb().batch();
  batch.set(getCheckoutSessionRef(session.id), sanitizeFirestoreValue(session) as DocumentData);
  batch.set(getOnboardingRef(session.id), sanitizeFirestoreValue(onboarding) as DocumentData);
  await batch.commit();

  return session;
};

export const getCheckoutSessionById = async (id: string) => {
  const snapshot = await getCheckoutSessionRef(id).get();
  return fromDoc<CheckoutSession>(snapshot);
};

export const getOnboardingBySessionId = async (sessionId: string) => {
  const snapshot = await getOnboardingRef(sessionId).get();
  return fromDoc<Onboarding>(snapshot);
};

const findSingleCheckoutSession = async (field: string, value: string) => {
  const snapshot = await getFirestoreDb()
    .collection(COLLECTIONS.checkoutSessions)
    .where(field, '==', value)
    .limit(1)
    .get();
  const [session] = fromQuery<CheckoutSession>(snapshot);
  return session ?? null;
};

export const getCheckoutSessionByCheckoutId = async (checkoutId: string) => findSingleCheckoutSession('checkoutId', checkoutId);
export const getCheckoutSessionByPaymentId = async (paymentId: string) => findSingleCheckoutSession('paymentId', paymentId);
export const getCheckoutSessionBySubscriptionId = async (subscriptionId: string) =>
  findSingleCheckoutSession('asaasSubscriptionId', subscriptionId);
export const getCheckoutSessionByCustomerId = async (customerId: string) => findSingleCheckoutSession('asaasCustomerId', customerId);

export const updateCheckoutSession = async (
  id: string,
  params: Partial<Omit<CheckoutSession, 'id' | 'createdAt' | 'updatedAt'>>,
) => {
  const existing = await getCheckoutSessionById(id);
  if (!existing) throw new Error('CHECKOUT_SESSION_NOT_FOUND');

  const nextStatus = params.status ?? existing.status;
  const paidAt =
    nextStatus === 'paid'
      ? params.paidAt === undefined
        ? existing.paidAt ?? new Date()
        : params.paidAt
      : params.paidAt === undefined
        ? existing.paidAt
        : params.paidAt;

  const session: CheckoutSession = {
    ...existing,
    ...params,
    status: nextStatus,
    paidAt,
    updatedAt: new Date(),
  };

  await getCheckoutSessionRef(id).set(sanitizeFirestoreValue(session) as DocumentData);
  return session;
};

export const upsertPaymentRecord = async (
  base: Partial<Payment> & { sessionId: string; method: Payment['method']; value: number },
) => {
  const record = toPayment(base);
  await getPaymentRef(record.id).set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

export const releaseOnboarding = async (sessionId: string) => {
  const existing = await getOnboardingBySessionId(sessionId);
  const now = new Date();

  if (!existing) {
    const onboarding = toOnboarding({ sessionId, status: 'released', releasedAt: now });
    await getOnboardingRef(sessionId).set(sanitizeFirestoreValue(onboarding) as DocumentData);
    return onboarding;
  }

  if (existing.status === 'completed' || existing.status === 'processing') return existing;

  const onboarding: Onboarding = {
    ...existing,
    status: 'released',
    releasedAt: existing.releasedAt ?? now,
    updatedAt: now,
  };

  await getOnboardingRef(sessionId).set(sanitizeFirestoreValue(onboarding) as DocumentData);
  return onboarding;
};

export const lockOnboarding = async (sessionId: string) => {
  const existing = await getOnboardingBySessionId(sessionId);
  if (!existing || existing.status === 'completed' || existing.status === 'processing') return existing;

  const onboarding: Onboarding = {
    ...existing,
    status: 'locked',
    updatedAt: new Date(),
  };

  await getOnboardingRef(sessionId).set(sanitizeFirestoreValue(onboarding) as DocumentData);
  return onboarding;
};

export const claimOnboardingForProvisioning = async (sessionId: string) => {
  return getFirestoreDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(getOnboardingRef(sessionId));
    const existing = fromDoc<Onboarding>(snapshot);

    if (!existing) {
      throw new Error('ONBOARDING_NOT_FOUND');
    }

    if (existing.status === 'completed') {
      return existing;
    }

    if (existing.status === 'processing') {
      throw new Error('ONBOARDING_IN_PROGRESS');
    }

    if (existing.status !== 'released') {
      throw new Error('ONBOARDING_LOCKED');
    }

    const onboarding: Onboarding = {
      ...existing,
      status: 'processing',
      updatedAt: new Date(),
    };

    transaction.set(getOnboardingRef(sessionId), sanitizeFirestoreValue(onboarding) as DocumentData);
    return onboarding;
  });
};

export const revertOnboardingProvisioning = async (sessionId: string) => {
  const existing = await getOnboardingBySessionId(sessionId);
  if (!existing || existing.status !== 'processing') return existing;

  const onboarding: Onboarding = {
    ...existing,
    status: existing.releasedAt ? 'released' : 'locked',
    updatedAt: new Date(),
  };

  await getOnboardingRef(sessionId).set(sanitizeFirestoreValue(onboarding) as DocumentData);
  return onboarding;
};

export const completeOnboarding = async (sessionId: string, params: { userId: string; clinicId: string }) => {
  const existing = await getOnboardingBySessionId(sessionId);
  if (!existing) throw new Error('ONBOARDING_NOT_FOUND');

  const onboarding: Onboarding = {
    ...existing,
    status: 'completed',
    userId: params.userId,
    clinicId: params.clinicId,
    completedAt: existing.completedAt ?? new Date(),
    updatedAt: new Date(),
  };

  await getOnboardingRef(sessionId).set(sanitizeFirestoreValue(onboarding) as DocumentData);
  return onboarding;
};

const mergeCustomerData = (customer: AsaasCustomer | null) => ({
  companyName: customer?.name ?? undefined,
  customerEmail: customer?.email ?? undefined,
  customerPhone: customer?.mobilePhone ?? customer?.phone ?? undefined,
  customerCpfCnpj: customer?.cpfCnpj ?? undefined,
  customerAddress: customer?.address ?? undefined,
  customerAddressNumber: customer?.addressNumber ?? undefined,
  customerAddressComplement: customer?.complement ?? undefined,
  customerPostalCode: customer?.postalCode ?? undefined,
  customerProvince: customer?.province ?? undefined,
});

const mapPaymentStatusToSessionStatus = (
  existingStatus: CheckoutSession['status'],
  paymentStatus?: string | null,
): CheckoutSession['status'] => {
  const normalized = normalizeStatus(paymentStatus);
  if (!normalized) return existingStatus;
  if (ACTIVE_PAYMENT_STATUSES.has(normalized)) return 'paid';
  if (PENDING_PAYMENT_STATUSES.has(normalized)) return 'waiting_payment';
  if (EXPIRED_PAYMENT_STATUSES.has(normalized)) return 'expired';
  if (CANCELLED_PAYMENT_STATUSES.has(normalized)) return 'cancelled';
  return existingStatus;
};

const mapCheckoutStatus = (
  existingStatus: CheckoutSession['status'],
  checkoutStatus?: string | null,
): CheckoutSession['status'] => {
  const normalized = normalizeStatus(checkoutStatus);
  if (!normalized) return existingStatus;
  if (normalized === 'PAID') return 'paid';
  if (normalized === 'EXPIRED') return 'expired';
  if (normalized === 'CANCELED' || normalized === 'CANCELLED') return 'cancelled';
  return existingStatus;
};

const sortPayments = <T extends { dateCreated?: string | null; dueDate?: string | null }>(payments: T[]) =>
  [...payments].sort((a, b) => {
    const aTime = new Date(a.dueDate ?? a.dateCreated ?? 0).getTime();
    const bTime = new Date(b.dueDate ?? b.dateCreated ?? 0).getTime();
    return bTime - aTime;
  });

const persistPaymentState = async (
  session: CheckoutSession,
  payment: AsaasPayment | AsaasSubscriptionPayment,
  customer: AsaasCustomer | null,
) => {
  const status = mapPaymentStatusToSessionStatus(session.status, payment.status);
  const updated = await updateCheckoutSession(session.id, {
    status,
    paymentId: payment.id,
    paymentStatus: payment.status ?? null,
    invoiceUrl: payment.invoiceUrl ?? session.invoiceUrl,
    asaasCustomerId: payment.customer ?? session.asaasCustomerId,
    asaasSubscriptionId: payment.subscription ?? session.asaasSubscriptionId,
    ...mergeCustomerData(customer),
  });

  await upsertPaymentRecord({
    id: payment.id,
    sessionId: session.id,
    asaasPaymentId: payment.id,
    status: payment.status ?? 'PENDING',
    method: session.paymentMethod,
    value: payment.value ?? session.value,
    invoiceUrl: payment.invoiceUrl ?? null,
    confirmedAt: status === 'paid' ? updated.paidAt ?? new Date() : null,
  });

  if (status === 'paid') {
    await releaseOnboarding(session.id);
  } else if (status === 'expired' || status === 'cancelled') {
    await lockOnboarding(session.id);
  }

  return updated;
};

export const syncCheckoutSessionWithAsaas = async (sessionId: string) => {
  const existing = await getCheckoutSessionById(sessionId);
  if (!existing) return null;

  let latestPayment: AsaasPayment | AsaasSubscriptionPayment | null = null;

  if (existing.checkoutId) {
    const payments = await listAsaasPayments({ checkoutSession: existing.checkoutId, limit: 10 });
    latestPayment = sortPayments(payments)[0] ?? null;
  } else if (existing.asaasSubscriptionId) {
    const payments = await listAsaasSubscriptionPayments(existing.asaasSubscriptionId);
    latestPayment = sortPayments(payments)[0] ?? null;
  }

  if (!latestPayment) return existing;

  const customer = latestPayment.customer ? await getAsaasCustomer(latestPayment.customer).catch(() => null) : null;
  return persistPaymentState(existing, latestPayment, customer);
};

export const markCheckoutSessionFromCheckoutWebhook = async (params: {
  checkoutId: string;
  checkoutStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) => {
  const existing = await getCheckoutSessionByCheckoutId(params.checkoutId);
  if (!existing) return null;

  const customer = params.customerId ? await getAsaasCustomer(params.customerId).catch(() => null) : null;
  const status = mapCheckoutStatus(existing.status, params.checkoutStatus);
  const updated = await updateCheckoutSession(existing.id, {
    status,
    asaasCustomerId: params.customerId ?? existing.asaasCustomerId,
    asaasSubscriptionId: params.subscriptionId ?? existing.asaasSubscriptionId,
    ...mergeCustomerData(customer),
  });

  if (status === 'paid') {
    await releaseOnboarding(existing.id);
  } else if (status === 'expired' || status === 'cancelled') {
    await lockOnboarding(existing.id);
  }

  return updated;
};

export const markCheckoutSessionFromPaymentWebhook = async (params: {
  paymentId?: string | null;
  paymentStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  invoiceUrl?: string | null;
  value?: number | null;
}) => {
  const existing = params.paymentId
    ? await getCheckoutSessionByPaymentId(params.paymentId)
    : params.subscriptionId
      ? await getCheckoutSessionBySubscriptionId(params.subscriptionId)
      : params.customerId
        ? await getCheckoutSessionByCustomerId(params.customerId)
        : null;

  if (!existing) return null;

  const customer = params.customerId ? await getAsaasCustomer(params.customerId).catch(() => null) : null;
  const fakePayment: AsaasPayment = {
    id: params.paymentId ?? existing.paymentId ?? randomUUID(),
    status: params.paymentStatus ?? existing.paymentStatus ?? 'PENDING',
    customer: params.customerId ?? existing.asaasCustomerId ?? undefined,
    subscription: params.subscriptionId ?? existing.asaasSubscriptionId ?? undefined,
    invoiceUrl: params.invoiceUrl ?? existing.invoiceUrl ?? undefined,
    value: params.value ?? existing.value,
  };

  return persistPaymentState(existing, fakePayment, customer);
};
