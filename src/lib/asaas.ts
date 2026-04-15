export type AsaasCustomer = {
  id: string;
  name?: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
};

export type AsaasCheckout = {
  id: string;
  url?: string;
  checkoutUrl?: string;
};

export type AsaasPaymentLink = {
  id: string;
  url: string;
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

export type AsaasPayment = AsaasSubscriptionPayment & {
  checkoutSession?: string;
  paymentLink?: string;
  externalReference?: string;
};

const trimSlash = (value: string) => value.replace(/\/+$/, '');
const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');

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
  cpfCnpj: string;
  phone: string;
  mobilePhone?: string | null;
  address: string;
  addressNumber: string;
  complement?: string | null;
  province: string;
  postalCode: string;
  externalReference?: string | null;
}) => {
  const payload = {
    name: params.name,
    email: params.email,
    cpfCnpj: onlyDigits(params.cpfCnpj),
    phone: onlyDigits(params.phone),
    mobilePhone: onlyDigits(params.mobilePhone ?? params.phone),
    address: params.address.trim(),
    addressNumber: params.addressNumber.trim(),
    complement: params.complement?.trim() || undefined,
    province: params.province.trim(),
    postalCode: onlyDigits(params.postalCode),
    externalReference: params.externalReference?.trim() || undefined,
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

const formatAsaasDateTime = (date: Date) => {
  const safeDate = new Date(date);
  return `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, '0')}-${String(safeDate.getDate()).padStart(2, '0')} ${String(safeDate.getHours()).padStart(2, '0')}:${String(safeDate.getMinutes()).padStart(2, '0')}:00`;
};

const formatAsaasDate = (date: Date) => {
  const safeDate = new Date(date);
  return `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, '0')}-${String(safeDate.getDate()).padStart(2, '0')}`;
};

export const createAsaasCheckoutSession = async (params: {
  billingTypes: Array<'CREDIT_CARD' | 'BOLETO'>;
  customerId?: string | null;
  customerData?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    address: string;
    addressNumber: string;
    complement?: string | null;
    province: string;
    postalCode: string;
  } | null;
  planName: string;
  description: string;
  value: number;
  successUrl: string;
  cancelUrl: string;
  expiredUrl: string;
  minutesToExpire?: number;
}) => {
  const now = new Date(Date.now() + 5 * 60 * 1000);
  const nextDueDate = formatAsaasDateTime(now);

  const checkout = await asaasRequest<AsaasCheckout>('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId || undefined,
      customerData: params.customerData
        ? {
            ...params.customerData,
            cpfCnpj: onlyDigits(params.customerData.cpfCnpj),
            phone: onlyDigits(params.customerData.phone),
            postalCode: onlyDigits(params.customerData.postalCode),
            complement: params.customerData.complement?.trim() || undefined,
          }
        : undefined,
      billingTypes: params.billingTypes,
      chargeTypes: ['RECURRENT'],
      minutesToExpire: params.minutesToExpire ?? 60,
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

export const createAsaasPaymentLink = async (params: {
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  name: string;
  description: string;
  value: number;
  successUrl: string;
  externalReference?: string | null;
  chargeType?: 'DETACHED' | 'RECURRENT' | 'INSTALLMENT';
  subscriptionCycle?: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  dueDateLimitDays?: number;
  autoRedirect?: boolean;
  notificationEnabled?: boolean;
}) => {
  return await asaasRequest<AsaasPaymentLink>('/paymentLinks', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      value: params.value,
      billingType: params.billingType,
      chargeType: params.chargeType ?? 'DETACHED',
      subscriptionCycle: params.chargeType === 'RECURRENT' ? params.subscriptionCycle ?? 'MONTHLY' : undefined,
      dueDateLimitDays: params.billingType === 'BOLETO' ? params.dueDateLimitDays ?? 3 : undefined,
      externalReference: params.externalReference?.trim() || undefined,
      notificationEnabled: params.notificationEnabled ?? false,
      callback: {
        successUrl: params.successUrl,
        autoRedirect: params.autoRedirect ?? false,
      },
      isAddressRequired: false,
    }),
    headers: getHeaders(true),
  });
};

export const createAsaasRecurringCheckout = async (params: {
  customerId?: string | null;
  customerData?: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
    address: string;
    addressNumber: string;
    complement?: string | null;
    province: string;
    postalCode: string;
  } | null;
  planName: string;
  description: string;
  value: number;
  successUrl: string;
  cancelUrl: string;
  expiredUrl: string;
}) => {
  return createAsaasCheckoutSession({
    billingTypes: ['CREDIT_CARD'],
    customerId: params.customerId,
    customerData: params.customerData,
    planName: params.planName,
    description: params.description,
    value: params.value,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    expiredUrl: params.expiredUrl,
  });
};

export const createAsaasSubscription = async (params: {
  customerId: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  value: number;
  description: string;
  nextDueDate?: Date;
  cycle?: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
}) => {
  const subscription = await asaasRequest<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingType: params.billingType,
      nextDueDate: formatAsaasDate(params.nextDueDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000)),
      value: params.value,
      cycle: params.cycle ?? 'MONTHLY',
      description: params.description,
    }),
    headers: getHeaders(true),
  });

  return subscription;
};

export const getAsaasCustomer = async (customerId: string) => {
  return await asaasRequest<AsaasCustomer>(`/customers/${customerId}`, { method: 'GET' });
};

export const listAsaasPayments = async (params: { checkoutSession?: string | null; externalReference?: string | null; limit?: number } = {}) => {
  const searchParams = new URLSearchParams();
  if (params.checkoutSession) searchParams.set('checkoutSession', params.checkoutSession);
  if (params.externalReference) searchParams.set('externalReference', params.externalReference);
  searchParams.set('limit', String(params.limit ?? 10));
  const suffix = searchParams.toString();
  const response = await asaasRequest<{ data?: AsaasPayment[] }>(`/payments${suffix ? `?${suffix}` : ''}`, {
    method: 'GET',
  });
  return response.data ?? [];
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
