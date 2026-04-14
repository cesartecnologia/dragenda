import { randomUUID } from 'crypto';

import { Timestamp, type DocumentData, type DocumentSnapshot, type QuerySnapshot } from 'firebase-admin/firestore';

import { pendingSignupsTable } from '@/db/schema';
import {
  getAsaasCustomer,
  listAsaasPayments,
  listAsaasSubscriptionPayments,
  type AsaasCustomer,
  type AsaasPayment,
  type AsaasSubscriptionPayment,
} from '@/lib/asaas';
import { getFirestoreDb } from '@/lib/firebase-admin';

type PendingSignup = typeof pendingSignupsTable.$inferSelect;

const COLLECTION = 'pendingSignups';

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

const sortPayments = <T extends { dateCreated?: string | null }>(payments: T[]) =>
  [...payments].sort((a, b) => {
    const aTime = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
    const bTime = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
    return bTime - aTime;
  });

const ACTIVE_PAYMENT_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const PENDING_PAYMENT_STATUSES = new Set(['PENDING', 'AWAITING_RISK_ANALYSIS', 'RECEIVED_AWAITING_CLEARING']);
const CANCELLED_PAYMENT_STATUSES = new Set(['OVERDUE', 'DELETED', 'REFUNDED', 'CHARGEBACK_REQUESTED', 'RECEIVED_IN_CASH_UNDONE']);

const normalizeStatus = (value?: string | null) => value?.trim().toUpperCase() ?? null;

const toPendingSignup = (base: Partial<PendingSignup> = {}): PendingSignup => {
  const now = new Date();
  return {
    id: base.id ?? randomUUID(),
    paymentMethod: base.paymentMethod ?? null,
    checkoutId: base.checkoutId ?? null,
    invoiceUrl: base.invoiceUrl ?? null,
    asaasCustomerId: base.asaasCustomerId ?? null,
    asaasSubscriptionId: base.asaasSubscriptionId ?? null,
    paymentId: base.paymentId ?? null,
    paymentStatus: base.paymentStatus ?? null,
    status: base.status ?? 'checkout_created',
    payerName: base.payerName ?? null,
    payerEmail: base.payerEmail ?? null,
    payerPhone: base.payerPhone ?? null,
    payerCpfCnpj: base.payerCpfCnpj ?? null,
    clinicName: base.clinicName ?? null,
    clinicCnpj: base.clinicCnpj ?? null,
    address: base.address ?? null,
    addressNumber: base.addressNumber ?? null,
    complement: base.complement ?? null,
    postalCode: base.postalCode ?? null,
    province: base.province ?? null,
    userId: base.userId ?? null,
    clinicId: base.clinicId ?? null,
    createdAt: base.createdAt ?? now,
    updatedAt: base.updatedAt ?? now,
  };
};

export const createPendingSignupIntent = async (base: Partial<PendingSignup> = {}) => {
  const record = toPendingSignup(base);
  await getFirestoreDb().collection(COLLECTION).doc(record.id).set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

export const getPendingSignupById = async (id: string) => {
  const snapshot = await getFirestoreDb().collection(COLLECTION).doc(id).get();
  return fromDoc<PendingSignup>(snapshot);
};

export const getPendingSignupByCheckoutId = async (checkoutId: string) => {
  const snapshot = await getFirestoreDb()
    .collection(COLLECTION)
    .where('checkoutId', '==', checkoutId)
    .limit(1)
    .get();
  const [record] = fromQuery<PendingSignup>(snapshot);
  return record ?? null;
};

export const getPendingSignupBySubscriptionId = async (subscriptionId: string) => {
  const snapshot = await getFirestoreDb()
    .collection(COLLECTION)
    .where('asaasSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();
  const [record] = fromQuery<PendingSignup>(snapshot);
  return record ?? null;
};

export const getPendingSignupByPaymentId = async (paymentId: string) => {
  const snapshot = await getFirestoreDb()
    .collection(COLLECTION)
    .where('paymentId', '==', paymentId)
    .limit(1)
    .get();
  const [record] = fromQuery<PendingSignup>(snapshot);
  return record ?? null;
};

export const updatePendingSignup = async (id: string, params: Partial<Omit<PendingSignup, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const ref = getFirestoreDb().collection(COLLECTION).doc(id);
  const existing = fromDoc<PendingSignup>(await ref.get());
  if (!existing) throw new Error('Pending signup not found');

  const record: PendingSignup = {
    ...existing,
    ...params,
    id,
    updatedAt: new Date(),
  };

  await ref.set(sanitizeFirestoreValue(record) as DocumentData);
  return record;
};

export const attachCheckoutToPendingSignup = async (id: string, checkoutId: string) => {
  return updatePendingSignup(id, { checkoutId, paymentMethod: 'credit_card', status: 'checkout_created' });
};

const mergeCustomerData = (customer: AsaasCustomer | null) => ({
  payerName: customer?.name ?? null,
  payerEmail: customer?.email ?? null,
  payerPhone: customer?.mobilePhone ?? customer?.phone ?? null,
  payerCpfCnpj: customer?.cpfCnpj ?? null,
  address: customer?.address ?? null,
  addressNumber: customer?.addressNumber ?? null,
  complement: customer?.complement ?? null,
  postalCode: customer?.postalCode ?? null,
  province: customer?.province ?? null,
});

const mapPaymentStatusToPendingStatus = (existingStatus: PendingSignup['status'], paymentStatus?: string | null): PendingSignup['status'] => {
  const normalizedPaymentStatus = normalizeStatus(paymentStatus);
  if (!normalizedPaymentStatus) return existingStatus;
  if (ACTIVE_PAYMENT_STATUSES.has(normalizedPaymentStatus)) return 'checkout_paid';
  if (PENDING_PAYMENT_STATUSES.has(normalizedPaymentStatus)) return 'payment_pending';
  if (CANCELLED_PAYMENT_STATUSES.has(normalizedPaymentStatus)) return 'checkout_cancelled';
  return existingStatus;
};

export const syncPendingSignupWithAsaas = async (intentId: string) => {
  const existing = await getPendingSignupById(intentId);
  if (!existing) return existing;
  if (existing.status === 'registration_completed') return existing;

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
  const status = mapPaymentStatusToPendingStatus(existing.status, latestPayment.status);

  return updatePendingSignup(intentId, {
    status,
    paymentId: latestPayment.id,
    paymentStatus: latestPayment.status ?? null,
    invoiceUrl: latestPayment.invoiceUrl ?? existing.invoiceUrl,
    asaasCustomerId: latestPayment.customer ?? existing.asaasCustomerId,
    asaasSubscriptionId: latestPayment.subscription ?? existing.asaasSubscriptionId,
    ...mergeCustomerData(customer),
  });
};

export const markPendingSignupFromCheckoutWebhook = async (params: {
  checkoutId: string;
  checkoutStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) => {
  const existing = await getPendingSignupByCheckoutId(params.checkoutId);
  if (!existing) return null;

  let customer: AsaasCustomer | null = null;
  if (params.customerId) {
    customer = await getAsaasCustomer(params.customerId).catch(() => null);
  }

  const normalizedCheckoutStatus = normalizeStatus(params.checkoutStatus);
  const status: PendingSignup['status'] = normalizedCheckoutStatus === 'PAID'
    ? 'checkout_paid'
    : normalizedCheckoutStatus === 'EXPIRED'
      ? 'checkout_expired'
      : normalizedCheckoutStatus === 'CANCELED'
        ? 'checkout_cancelled'
        : existing.status;

  return updatePendingSignup(existing.id, {
    status,
    asaasCustomerId: params.customerId ?? existing.asaasCustomerId,
    asaasSubscriptionId: params.subscriptionId ?? existing.asaasSubscriptionId,
    ...mergeCustomerData(customer),
  });
};

export const markPendingSignupFromPaymentWebhook = async (params: {
  paymentId?: string | null;
  paymentStatus?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  invoiceUrl?: string | null;
}) => {
  const existing = params.paymentId
    ? await getPendingSignupByPaymentId(params.paymentId)
    : params.subscriptionId
      ? await getPendingSignupBySubscriptionId(params.subscriptionId)
      : null;

  if (!existing) return null;

  let customer: AsaasCustomer | null = null;
  if (params.customerId) {
    customer = await getAsaasCustomer(params.customerId).catch(() => null);
  }

  return updatePendingSignup(existing.id, {
    status: mapPaymentStatusToPendingStatus(existing.status, params.paymentStatus),
    paymentId: params.paymentId ?? existing.paymentId,
    paymentStatus: params.paymentStatus ?? existing.paymentStatus,
    invoiceUrl: params.invoiceUrl ?? existing.invoiceUrl,
    asaasCustomerId: params.customerId ?? existing.asaasCustomerId,
    asaasSubscriptionId: params.subscriptionId ?? existing.asaasSubscriptionId,
    ...mergeCustomerData(customer),
  });
};

export const completePendingSignup = async (id: string, params: { userId: string; clinicId: string }) => {
  return updatePendingSignup(id, {
    status: 'registration_completed',
    userId: params.userId,
    clinicId: params.clinicId,
  });
};
