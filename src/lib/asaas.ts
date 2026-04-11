import { type ClinicCompanyType } from '@/db/schema';

export type AsaasCustomer = {
  id: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
  mobilePhone?: string;
};

export type AsaasCheckout = {
  id: string;
  url?: string;
  checkoutUrl?: string;
};

export type AsaasSubscription = {
  id: string;
  customer?: string;
  status?: string;
  billingType?: string;
  value?: number;
  cycle?: string;
  description?: string;
  dateCreated?: string;
  nextDueDate?: string;
  deleted?: boolean;
};

export type AsaasSubscriptionPayment = {
  id: string;
  status?: string;
  customer?: string;
  subscription?: string;
  dueDate?: string;
  value?: number;
  billingType?: string;
  dateCreated?: string;
  invoiceUrl?: string;
};

const trimSlash = (value: string) => value.replace(/\/+$/, '');
const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');
const normalizeText = (value?: string | null) => {
  const normalized = value?.trim() ?? '';
  return normalized || undefined;
};

export const getAsaasApiBaseUrl = () => {
  const configured = process.env.ASAAS_API_BASE_URL?.trim();
  if (configured) return trimSlash(configured);
  return process.env.NODE_ENV === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
};

export const getAsaasCheckoutBaseUrl = () => {
  const configured = process.env.ASAAS_CHECKOUT_BASE_URL?.trim();
  if (configured) return trimSlash(configured);
  return getAsaasApiBaseUrl().includes('api-sandbox')
    ? 'https://sandbox.asaas.com/checkoutSession/show'
    : 'https://asaas.com/checkoutSession/show';
};

const getAsaasAccessToken = () => {
  const token = process.env.ASAAS_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('ASAAS_ACCESS_TOKEN não configurado.');
  return token;
};

const getHeaders = (hasBody = false) => {
  const headers = new Headers({ access_token: getAsaasAccessToken() });
  if (hasBody) headers.set('Content-Type', 'application/json');
  return headers;
};

const parseError = async (response: Response) => {
  try {
    const payload = await response.json();
    const apiMessage = payload?.errors?.[0]?.description ?? payload?.message ?? payload?.error;
    return typeof apiMessage === 'string' ? apiMessage : `Asaas retornou HTTP ${response.status}`;
  } catch {
    return `Asaas retornou HTTP ${response.status}`;
  }
};

export const asaasRequest = async <T,>(path: string, init?: RequestInit) => {
  const hasBody = Boolean(init?.body);
  const response = await fetch(`${getAsaasApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    cache: 'no-store',
    ...init,
    headers: init?.headers ? new Headers(init.headers) : getHeaders(hasBody),
  });

  if (!response.ok) throw new Error(await parseError(response));

  if (response.status === 204) return null as T;
  return (await response.json()) as T;
};

export const buildAsaasCheckoutUrl = (checkoutId: string) => {
  const baseUrl = getAsaasCheckoutBaseUrl();
  return `${baseUrl}?id=${encodeURIComponent(checkoutId)}`;
};

export const upsertAsaasCustomer = async (params: {
  asaasCustomerId?: string | null;
  name: string;
  email: string;
  cpfCnpj?: string | null;
  mobilePhone?: string | null;
  company?: string | null;
  postalCode?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  province?: string | null;
  externalReference?: string | null;
  companyType?: ClinicCompanyType | null;
}) => {
  const payload = {
    name: params.name,
    email: params.email,
    cpfCnpj: onlyDigits(params.cpfCnpj) || undefined,
    mobilePhone: onlyDigits(params.mobilePhone) || undefined,
    company: normalizeText(params.company),
    postalCode: onlyDigits(params.postalCode) || undefined,
    address: normalizeText(params.address),
    addressNumber: normalizeText(params.addressNumber),
    complement: normalizeText(params.complement),
    province: normalizeText(params.province),
    externalReference: normalizeText(params.externalReference),
    notificationDisabled: true,
    ...(params.companyType ? { personType: 'JURIDICA' as const, companyType: params.companyType } : {}),
  };

  if (params.asaasCustomerId) {
    return await asaasRequest<AsaasCustomer>(`/customers/${params.asaasCustomerId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: getHeaders(true),
    });
  }

  return await asaasRequest<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: getHeaders(true),
  });
};

export const createAsaasRecurringCheckout = async (params: {
  customerId: string;
  planName: string;
  description: string;
  value: number;
  successUrl: string;
  cancelUrl: string;
  expiredUrl: string;
  clinicName?: string | null;
}) => {
  const now = new Date(Date.now() + 5 * 60 * 1000);
  const nextDueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const checkout = await asaasRequest<AsaasCheckout>('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 60,
      callback: {
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        expiredUrl: params.expiredUrl,
      },
      items: [
        {
          name: params.planName,
          description: params.description,
          quantity: 1,
          value: params.value,
        },
      ],
      subscription: {
        cycle: 'MONTHLY',
        nextDueDate,
      },
    }),
    headers: getHeaders(true),
  });

  return {
    ...checkout,
    checkoutUrl: checkout.checkoutUrl ?? checkout.url ?? buildAsaasCheckoutUrl(checkout.id),
  };
};

export const getAsaasSubscription = async (subscriptionId: string) => {
  return await asaasRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`, { method: 'GET' });
};

export const listAsaasSubscriptions = async (params: { customer?: string | null; limit?: number } = {}) => {
  const searchParams = new URLSearchParams();
  if (params.customer) searchParams.set('customer', params.customer);
  searchParams.set('limit', String(params.limit ?? 20));
  const suffix = searchParams.toString();
  const response = await asaasRequest<{ data?: AsaasSubscription[] }>(`/subscriptions${suffix ? `?${suffix}` : ''}`, {
    method: 'GET',
  });
  return response.data ?? [];
};

export const listAsaasSubscriptionPayments = async (subscriptionId: string) => {
  const response = await asaasRequest<{ data?: AsaasSubscriptionPayment[] }>(`/subscriptions/${subscriptionId}/payments`, {
    method: 'GET',
  });
  return response.data ?? [];
};

export const deleteAsaasSubscription = async (subscriptionId: string) => {
  return await asaasRequest<{ deleted?: boolean } | null>(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
};
