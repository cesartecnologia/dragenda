import { randomUUID } from 'crypto';

import { Timestamp, type DocumentData, type DocumentSnapshot, type QuerySnapshot } from 'firebase-admin/firestore';

import { checkoutSessionsTable, onboardingTable, paymentsTable, type CheckoutPaymentMethod, type CheckoutSessionStatus } from '@/db/schema';
import { getAsaasCustomer, listAsaasPayments, type AsaasCustomer, type AsaasPayment } from '@/lib/asaas';
import { getFirestoreDb } from '@/lib/firebase-admin';

type CheckoutSession = typeof checkoutSessionsTable.$inferSelect;
type Payment = typeof paymentsTable.$inferSelect;
type Onboarding = typeof onboardingTable.$inferSelect;

const CHECKOUT_COLLECTION = 'checkoutSessions';
const PAYMENTS_COLLECTION = 'payments';
const ONBOARDING_COLLECTION = 'onboarding';

const PLAN_ID = 'essential';
const PLAN_NAME = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

const isTimestamp = (value: unknown): value is Timestamp => value instanceof Timestamp;

const normalizeFirestoreValue = <T,>(value: T): T => {
  if (isTimestamp(value)) return value.toDate() as T;
  if (Array.isArray(value)) return value.map((item) => normalizeFirestoreValue(item)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeFirestoreValue(item)])) as T;
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
const normalizeBillingType = (value?: string | null): CheckoutPaymentMethod | null => {
  const normalized = normalizeStatus(value);
  if (normalized === 'CREDIT_CARD') return 'credit_card';
  if (normalized === 'BOLETO') return 'boleto';
  return null;
};

const ACTIVE_PAYMENT_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const PENDING_PAYMENT_STATUSES = new Set(['PENDING', 'AWAITING_RISK_ANALYSIS', 'RECEIVED_AWAITING_CLEARING']);
const EXPIRED_PAYMENT_STATUSES = new Set(['OVERDUE']);
const CANCELLED_PAYMENT_STATUSES = new Set(['DELETED', 'REFUNDED', 'CHARGEBACK_REQUESTED', 'RECEIVED_IN_CASH_UNDONE']);

const sortPayments = <T extends { dateCreated?: string | null }>(payments: T[]) =>
  [...payments].sort((a, b) => {
    const aTime = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
    const bTime = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
    return bTime - aTime;
  });

const mergeCustomerData = (customer: AsaasCustomer | null) => ({
  payerName: customer?.name ?? null,
  payerEmail: customer?.email ?? null,
  payerPhone: customer?.mobilePhone ?? customer?.phone ?? null,
  payerCpfCnpj: customer?.cpfCnpj ?? null,
});

const getStatusFromPaymentStatus = (
  currentStatus: CheckoutSessionStatus,
  paymentStatus?: string | null,
): CheckoutSessionStatus => {
  const normalized = normalizeStatus(paymentStatus);
  if (!normalized) return currentStatus;
  if (ACTIVE_PAYMENT_STATUSES.has(normalized)) return 'paid';
  if (PENDING_PAYMENT_STATUSES.has(normalized)) return 'waiting_payment';
  if (EXPIRED_PAYMENT_STATUSES.has(normalized)) return 'expired';
  if (CANCELLED_PAYMENT_STATUSES.has(normalized)) return 'cancelled';
  return currentStatus;
};

const getStatusFromCheckoutStatus = (
  currentStatus: CheckoutSessionStatus,
  checkoutStatus?: string | null,
): CheckoutSessionStatus => {
  const normalized = normalizeStatus(checkoutStatus);
  if (!normalized) return currentStatus;
  if (normalized === 'PAID') return 'paid';
  if (normalized === 'EXPIRED') return 'expired';
  if (normalized === 'CANCELED' || normalized === 'CANCELLED') return 'cancelled';
  return currentStatus;
};

const toCheckoutSession = (params: {
  id?: string;
  paymentMethod: CheckoutPaymentMethod;
  status?: CheckoutSessionStatus;
}) => {
  const now = new Date();
  const record: CheckoutSession = {
    id: params.id ?? randomUUID(),
    planId: PLAN_ID,
    planName: PLAN_NAME,
    value: PLAN_VALUE,
    paymentMethod: params.paymentMethod,
    status: params.status ?? 'initiated',
    asaasCheckoutId: null,
    asaasPaymentLinkId: null,
    asaasCustomerId: null,
    asaasSubscriptionId: null,
    paymentId: null,
    paymentStatus: null,
    checkoutUrl: null,
    invoiceUrl: null,
    payerName: null,
    payerEmail: null,
    payerPhone: null,
    payerCpfCnpj: null,
    paidAt: null,
    createdAt: now,
    updatedAt: now,
  };
  return record;
};

const toOnboarding = (sessionId: string): Onboarding => {
  const now = new Date();
  return {
    id: sessionId,
    sessionId,
    status: 'locked',
    userId: null,
    clinicId: null,
    releasedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

export const createCheckoutSession = async (params: { paymentMethod: CheckoutPaymentMethod }) => {
  const record = toCheckoutSession(params);
  const onboarding = toOnboarding(record.id);
  const batch = getFirestoreDb().batch();
  batch.set(getFirestoreDb().collection(CHECKOUT_COLLECTION).doc(record.id), sanitizeFirestoreValue(record) as DocumentData);
  batch.set(getFirestoreDb().collection(ONBOARDING_COLLECTION).doc(record.id), sanitizeFirestoreValue(onboarding) as DocumentData);
  await batch.commit();
  return record;
};

export const getCheckoutSessionById = async (id: string) => {
  const snapshot = await getFirestoreDb().collection(CHECKOUT_COLLECTION).doc(id).get();
  return fromDoc<CheckoutSession>(snapshot);
};

export const getOnboardingBySessionId = async (sessionId: string) => {
  const snapshot = await getFirestoreDb().collection(ONBOARDING_COLLECTION).doc(sessionId).get();
  return fromDoc<Onboarding>(snapshot);
};

export const getCheckoutSessionByAsaasCheckoutId = async (asaasCheckoutId: string) => {
  const snapshot = await getFirestoreDb()
    .collection(CHECKOUT_COLLECTION)
    .where('asaasCheckoutId', '==', asaasCheckoutId)
    .limit(1)
    .get();
  const [record] = fromQuery<CheckoutSession>(snapshot);
  return record ?? null;
};

export const getCheckoutSessionByPaymentLinkId = async (asaasPaymentLinkId: string) => {
  const snapshot = await getFirestoreDb()
    .collection(CHECKOUT_COLLECTION)
    .where('asaasPaymentLinkId', '==', asaasPaymentLinkId)
    .limit(1)
    .get();
  const [record] = fromQuery<CheckoutSession>(snapshot);
  return record ?? null;
};

export const getCheckoutSessionByPaymentId = async (paymentId: string) => {
  const snapshot = await getFirestoreDb()
    .collection(CHECKOUT_COLLECTION)
    .where('paymentId', '==', paymentId)
    .limit(1)
    .get();
  const [record] = fromQuery<CheckoutSession>(snapshot);
  return record ?? null;
};

export const getCheckoutSessionBySubscriptionId = async (asaasSubscriptionId: string) => {
  const snapshot = await getFirestoreDb()
    .collection(CHECKOUT_COLLECTION)
    .where('asaasSubscriptionId', '==', asaasSubscriptionId)
    .limit(1)
    .get();
  const [record] = fromQuery<CheckoutSession>(snapshot);
  return record ?? null;
};

export const updateCheckoutSession = async (
  id: string,
  params: Partial<Omit<CheckoutSession, 'id' | 'createdAt' | 'updatedAt'>>,
) => {
  const ref = getFirestoreDb().collection(CHECKOUT_COLLECTION).doc(id);
  const existing = fromDoc<CheckoutSession>(await ref.get());
  if (!existing) throw new Error('Checkout session not found');

  const nextStatus = params.status ?? existing.status;
  const paidAt = nextStatus === 'paid' ? params.paidAt ?? existing.paidAt ?? new Date() : params.paidAt ?? existing.paidAt;

  const record: CheckoutSession = {
    ...existing,
    ...params,
    id,
    status: nextStatus,
    paidAt,
    updatedAt: new Date(),
  };

  await ref.set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

export const attachAsaasCheckoutToSession = async (
  id: string,
  params: { asaasCheckoutId: string; checkoutUrl: string },
) => {
  return updateCheckoutSession(id, {
    asaasCheckoutId: params.asaasCheckoutId,
    checkoutUrl: params.checkoutUrl,
    status: 'waiting_payment',
  });
};

export const attachAsaasPaymentLinkToSession = async (
  id: string,
  params: { asaasPaymentLinkId: string; checkoutUrl: string },
) => {
  return updateCheckoutSession(id, {
    asaasPaymentLinkId: params.asaasPaymentLinkId,
    checkoutUrl: params.checkoutUrl,
    status: 'waiting_payment',
  });
};

export const upsertPaymentFromCheckoutSession = async (params: {
  sessionId: string | null;
  asaasPaymentId: string;
  status?: string | null;
  method?: CheckoutPaymentMethod | null;
  value?: number | null;
  invoiceUrl?: string | null;
  asaasCustomerId?: string | null;
  asaasSubscriptionId?: string | null;
}) => {
  const ref = getFirestoreDb().collection(PAYMENTS_COLLECTION).doc(params.asaasPaymentId);
  const existing = fromDoc<Payment>(await ref.get());
  const now = new Date();
  const status = params.status ?? existing?.status ?? null;
  const paidAt = ACTIVE_PAYMENT_STATUSES.has(normalizeStatus(status) ?? '') ? existing?.paidAt ?? now : existing?.paidAt ?? null;

  const record: Payment = {
    id: params.asaasPaymentId,
    sessionId: params.sessionId ?? existing?.sessionId ?? null,
    asaasPaymentId: params.asaasPaymentId,
    status,
    method: params.method ?? existing?.method ?? null,
    value: params.value ?? existing?.value ?? null,
    invoiceUrl: params.invoiceUrl ?? existing?.invoiceUrl ?? null,
    asaasCustomerId: params.asaasCustomerId ?? existing?.asaasCustomerId ?? null,
    asaasSubscriptionId: params.asaasSubscriptionId ?? existing?.asaasSubscriptionId ?? null,
    paidAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await ref.set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

export const releaseOnboardingForSession = async (sessionId: string) => {
  const ref = getFirestoreDb().collection(ONBOARDING_COLLECTION).doc(sessionId);
  const existing = fromDoc<Onboarding>(await ref.get());
  if (!existing) throw new Error('Onboarding not found');
  if (existing.status === 'completed') return existing;

  const now = new Date();
  const record: Onboarding = {
    ...existing,
    status: existing.status === 'completed' ? 'completed' : 'released',
    releasedAt: existing.releasedAt ?? now,
    updatedAt: now,
  };

  await ref.set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

export const completeOnboardingForSession = async (sessionId: string, params: { userId: string; clinicId: string }) => {
  const ref = getFirestoreDb().collection(ONBOARDING_COLLECTION).doc(sessionId);
  const existing = fromDoc<Onboarding>(await ref.get());
  if (!existing) throw new Error('Onboarding not found');

  const now = new Date();
  const record: Onboarding = {
    ...existing,
    status: 'completed',
    userId: params.userId,
    clinicId: params.clinicId,
    releasedAt: existing.releasedAt ?? now,
    completedAt: now,
    updatedAt: now,
  };

  await ref.set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

export const beginOnboardingProcessing = async (sessionId: string) => {
  const ref = getFirestoreDb().collection(ONBOARDING_COLLECTION).doc(sessionId);

  return getFirestoreDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const existing = fromDoc<Onboarding>(snapshot);

    if (!existing) {
      throw new Error('CHECKOUT_SESSION_NOT_FOUND');
    }

    if (existing.status === 'completed') {
      throw new Error('ONBOARDING_ALREADY_COMPLETED');
    }

    if (existing.status !== 'released') {
      throw new Error('ONBOARDING_NOT_RELEASED');
    }

    const now = new Date();
    const record: Onboarding = {
      ...existing,
      status: 'processing',
      updatedAt: now,
    };

    transaction.set(ref, sanitizeFirestoreValue(record) as DocumentData);
    return record;
  });
};

export const resetOnboardingProcessing = async (sessionId: string) => {
  const ref = getFirestoreDb().collection(ONBOARDING_COLLECTION).doc(sessionId);
  const existing = fromDoc<Onboarding>(await ref.get());
  if (!existing || existing.status !== 'processing') return existing;

  const record: Onboarding = {
    ...existing,
    status: existing.completedAt ? 'completed' : 'released',
    updatedAt: new Date(),
  };

  await ref.set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

const updateSessionAndOnboardingFromPayment = async (
  session: CheckoutSession,
  params: {
    paymentId?: string | null;
    paymentStatus?: string | null;
    customerId?: string | null;
    subscriptionId?: string | null;
    invoiceUrl?: string | null;
    method?: CheckoutPaymentMethod | null;
    value?: number | null;
  },
) => {
  let customer: AsaasCustomer | null = null;
  if (params.customerId) {
    customer = await getAsaasCustomer(params.customerId).catch(() => null);
  }

  const status = getStatusFromPaymentStatus(session.status, params.paymentStatus);
  const nextSession = await updateCheckoutSession(session.id, {
    status,
    paymentId: params.paymentId ?? session.paymentId,
    paymentStatus: params.paymentStatus ?? session.paymentStatus,
    invoiceUrl: params.invoiceUrl ?? session.invoiceUrl,
    asaasCustomerId: params.customerId ?? session.asaasCustomerId,
    asaasSubscriptionId: params.subscriptionId ?? session.asaasSubscriptionId,
    paymentMethod: params.method ?? session.paymentMethod,
    value: params.value ?? session.value,
    ...mergeCustomerData(customer),
  });

  if (params.paymentId) {
    await upsertPaymentFromCheckoutSession({
      sessionId: session.id,
      asaasPaymentId: params.paymentId,
      status: params.paymentStatus,
      method: params.method ?? session.paymentMethod,
      value: params.value ?? session.value,
      invoiceUrl: params.invoiceUrl ?? session.invoiceUrl,
      asaasCustomerId: params.customerId ?? session.asaasCustomerId,
      asaasSubscriptionId: params.subscriptionId ?? session.asaasSubscriptionId,
    });
  }

  if (nextSession.status === 'paid') {
    await releaseOnboardingForSession(nextSession.id);
  }

  return nextSession;
};

export const markCheckoutSessionFromCheckoutWebhook = async (params: {
  checkoutId: string;
  checkoutStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) => {
  const session = await getCheckoutSessionByAsaasCheckoutId(params.checkoutId);
  if (!session) return null;

  let customer: AsaasCustomer | null = null;
  if (params.customerId) {
    customer = await getAsaasCustomer(params.customerId).catch(() => null);
  }

  const nextSession = await updateCheckoutSession(session.id, {
    status: getStatusFromCheckoutStatus(session.status, params.checkoutStatus),
    asaasCustomerId: params.customerId ?? session.asaasCustomerId,
    asaasSubscriptionId: params.subscriptionId ?? session.asaasSubscriptionId,
    ...mergeCustomerData(customer),
  });

  if (nextSession.status === 'paid') {
    await releaseOnboardingForSession(nextSession.id);
  }

  return nextSession;
};

export const markCheckoutSessionFromPaymentWebhook = async (params: {
  paymentId?: string | null;
  paymentStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  checkoutSessionId?: string | null;
  paymentLinkId?: string | null;
  externalReference?: string | null;
  invoiceUrl?: string | null;
  billingType?: string | null;
  value?: number | null;
}) => {
  const sessionByPaymentId = params.paymentId ? await getCheckoutSessionByPaymentId(params.paymentId) : null;
  const sessionByCheckoutId = !sessionByPaymentId && params.checkoutSessionId
    ? await getCheckoutSessionByAsaasCheckoutId(params.checkoutSessionId)
    : null;
  const sessionByPaymentLinkId = !sessionByPaymentId && !sessionByCheckoutId && params.paymentLinkId
    ? await getCheckoutSessionByPaymentLinkId(params.paymentLinkId)
    : null;
  const sessionBySubscriptionId = !sessionByPaymentId && !sessionByCheckoutId && !sessionByPaymentLinkId && params.subscriptionId
    ? await getCheckoutSessionBySubscriptionId(params.subscriptionId)
    : null;
  const sessionByExternalReference = !sessionByPaymentId && !sessionByCheckoutId && !sessionByPaymentLinkId && !sessionBySubscriptionId && params.externalReference
    ? await getCheckoutSessionById(params.externalReference)
    : null;

  const session = sessionByPaymentId ?? sessionByCheckoutId ?? sessionByPaymentLinkId ?? sessionBySubscriptionId ?? sessionByExternalReference;
  if (!session) return null;

  return updateSessionAndOnboardingFromPayment(session, {
    paymentId: params.paymentId,
    paymentStatus: params.paymentStatus,
    customerId: params.customerId,
    subscriptionId: params.subscriptionId,
    invoiceUrl: params.invoiceUrl,
    method: normalizeBillingType(params.billingType) ?? session.paymentMethod,
    value: params.value ?? session.value,
  });
};

export const syncCheckoutSessionWithAsaas = async (sessionId: string) => {
  const session = await getCheckoutSessionById(sessionId);
  if (!session) return session;
  if (session.status === 'paid') return session;

  const payments = session.asaasCheckoutId
    ? await listAsaasPayments({ checkoutSession: session.asaasCheckoutId, limit: 20 })
    : await listAsaasPayments({ externalReference: session.id, limit: 20 });
  const latestPayment = sortPayments(payments)[0] as AsaasPayment | undefined;
  if (!latestPayment) return session;

  return updateSessionAndOnboardingFromPayment(session, {
    paymentId: latestPayment.id,
    paymentStatus: latestPayment.status ?? null,
    customerId: latestPayment.customer ?? null,
    subscriptionId: latestPayment.subscription ?? null,
    invoiceUrl: latestPayment.invoiceUrl ?? null,
    method: normalizeBillingType(latestPayment.billingType) ?? session.paymentMethod,
    value: latestPayment.value ?? session.value,
  });
};
