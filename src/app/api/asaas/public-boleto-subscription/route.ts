import { NextResponse } from 'next/server';

import { createAsaasSubscription, listAsaasSubscriptionPayments, upsertAsaasCustomer } from '@/lib/asaas';
import { createCheckoutSession, updateCheckoutSession, upsertPaymentRecord } from '@/server/checkout-sessions';
import {
  normalizePublicCheckoutInput,
  PLAN_DESCRIPTION,
  PLAN_ID,
  PLAN_LABEL,
  PLAN_VALUE,
  validatePublicCheckoutInput,
} from '@/server/public-checkout';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const POST = async (request: Request) => {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const input = normalizePublicCheckoutInput(body);
    const validationError = validatePublicCheckoutInput(input);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const session = await createCheckoutSession({
      planId: PLAN_ID,
      planName: PLAN_LABEL,
      value: PLAN_VALUE,
      paymentMethod: 'boleto',
      status: 'waiting_payment',
      customerName: input.responsibleName,
      companyName: input.clinicName,
      customerEmail: input.email,
      customerPhone: input.clinicPhoneNumber,
      customerCpfCnpj: input.clinicCnpj,
      customerAddress: input.clinicAddress,
      customerAddressNumber: input.clinicAddressNumber,
      customerAddressComplement: input.clinicAddressComplement,
      customerPostalCode: input.clinicPostalCode,
      customerProvince: input.clinicProvince,
    });

    const customer = await upsertAsaasCustomer({
      name: input.clinicName,
      email: input.email,
      cpfCnpj: input.clinicCnpj,
      phone: input.clinicPhoneNumber,
      mobilePhone: input.clinicPhoneNumber,
      address: input.clinicAddress,
      addressNumber: input.clinicAddressNumber,
      complement: input.clinicAddressComplement,
      province: input.clinicProvince,
      postalCode: input.clinicPostalCode,
      externalReference: session.id,
    });

    const subscription = await createAsaasSubscription({
      customerId: customer.id,
      billingType: 'BOLETO',
      value: PLAN_VALUE,
      description: PLAN_DESCRIPTION,
      nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      cycle: 'MONTHLY',
    });

    let firstPayment = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const payments = await listAsaasSubscriptionPayments(subscription.id);
      firstPayment = payments[0] ?? null;
      if (firstPayment) break;
      await wait(800);
    }

    const updated = await updateCheckoutSession(session.id, {
      asaasCustomerId: customer.id,
      asaasSubscriptionId: subscription.id,
      paymentId: firstPayment?.id ?? null,
      paymentStatus: firstPayment?.status ?? 'PENDING',
      invoiceUrl: firstPayment?.invoiceUrl ?? null,
      status: 'waiting_payment',
    });

    if (firstPayment) {
      await upsertPaymentRecord({
        id: firstPayment.id,
        sessionId: updated.id,
        asaasPaymentId: firstPayment.id,
        status: firstPayment.status ?? 'PENDING',
        method: 'boleto',
        value: firstPayment.value ?? PLAN_VALUE,
        invoiceUrl: firstPayment.invoiceUrl ?? null,
      });
    }

    return NextResponse.json({
      ok: true,
      sessionId: updated.id,
      invoiceUrl: firstPayment?.invoiceUrl ?? null,
    });
  } catch (error) {
    console.error('PUBLIC_BOLETO_SUBSCRIPTION_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível gerar o boleto agora.' }, { status: 500 });
  }
};
