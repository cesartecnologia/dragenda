import { NextResponse } from 'next/server';

import { createAsaasSubscription, listAsaasSubscriptionPayments, upsertAsaasCustomer } from '@/lib/asaas';
import { createPendingSignupIntent, updatePendingSignup } from '@/server/pending-signups';

const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');
const PLAN_DESCRIPTION = 'Assinatura mensal para liberar o acesso completo da clínica.';
const onlyDigits = (value?: string) => (value ?? '').replace(/\D/g, '');
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as {
      responsibleName?: string;
      email?: string;
      clinicName?: string;
      clinicCnpj?: string;
      clinicPhoneNumber?: string;
      clinicAddress?: string;
      clinicAddressNumber?: string;
      clinicAddressComplement?: string;
      clinicPostalCode?: string;
      clinicProvince?: string;
    };

    const responsibleName = body.responsibleName?.trim();
    const email = body.email?.trim().toLowerCase();
    const clinicName = body.clinicName?.trim();
    const clinicCnpj = onlyDigits(body.clinicCnpj);
    const clinicPhoneNumber = onlyDigits(body.clinicPhoneNumber);
    const clinicAddress = body.clinicAddress?.trim();
    const clinicAddressNumber = body.clinicAddressNumber?.trim();
    const clinicAddressComplement = body.clinicAddressComplement?.trim() || null;
    const clinicPostalCode = onlyDigits(body.clinicPostalCode);
    const clinicProvince = body.clinicProvince?.trim();

    if (!responsibleName || !email || !clinicName || clinicCnpj.length !== 14 || clinicPhoneNumber.length < 10 || !clinicAddress || !clinicAddressNumber || clinicPostalCode.length !== 8 || !clinicProvince) {
      return NextResponse.json({ error: 'Preencha todos os dados obrigatórios para gerar o boleto.' }, { status: 400 });
    }

    const intent = await createPendingSignupIntent({
      paymentMethod: 'boleto',
      status: 'payment_pending',
      payerName: responsibleName,
      payerEmail: email,
      payerPhone: clinicPhoneNumber,
      payerCpfCnpj: clinicCnpj,
      clinicName,
      clinicCnpj,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      complement: clinicAddressComplement,
      postalCode: clinicPostalCode,
      province: clinicProvince,
    });

    const customer = await upsertAsaasCustomer({
      name: clinicName,
      email,
      cpfCnpj: clinicCnpj,
      phone: clinicPhoneNumber,
      mobilePhone: clinicPhoneNumber,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      complement: clinicAddressComplement,
      province: clinicProvince,
      postalCode: clinicPostalCode,
      externalReference: intent.id,
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

    await updatePendingSignup(intent.id, {
      asaasCustomerId: customer.id,
      asaasSubscriptionId: subscription.id,
      paymentId: firstPayment?.id ?? null,
      paymentStatus: firstPayment?.status ?? 'PENDING',
      invoiceUrl: firstPayment?.invoiceUrl ?? null,
      status: 'payment_pending',
    });

    return NextResponse.json({
      ok: true,
      intentId: intent.id,
      invoiceUrl: firstPayment?.invoiceUrl ?? null,
    });
  } catch (error) {
    console.error('PUBLIC_BOLETO_SUBSCRIPTION_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível gerar o boleto agora.' }, { status: 500 });
  }
};
