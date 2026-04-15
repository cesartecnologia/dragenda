import { NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase-admin';
import { createAsaasSubscription, upsertAsaasCustomer } from '@/lib/asaas';
import { createClinicForUser, updateClinicSettings, updateUserAsaasSubscription, upsertUserProfile } from '@/server/clinic-data';
import {
  beginOnboardingProcessing,
  completeOnboardingForSession,
  getCheckoutSessionById,
  getOnboardingBySessionId,
  resetOnboardingProcessing,
  updateCheckoutSession,
} from '@/server/checkout-sessions';

const validateEmail = (email: string) => /.+@.+\..+/.test(email);
const onlyDigits = (value?: string) => (value ?? '').replace(/\D/g, '');

export const POST = async (request: Request) => {
  let sessionId = '';
  let shouldResetProcessing = false;

  try {
    const body = (await request.json()) as {
      sessionId?: string;
      intentId?: string;
      name?: string;
      email?: string;
      password?: string;
      clinicName?: string;
      clinicCnpj?: string;
      clinicPhoneNumber?: string;
      clinicAddress?: string;
      clinicAddressNumber?: string;
      clinicAddressComplement?: string;
      clinicPostalCode?: string;
      clinicProvince?: string;
    };

    sessionId = body.sessionId?.trim() || body.intentId?.trim() || '';
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const clinicName = body.clinicName?.trim();
    const clinicCnpj = onlyDigits(body.clinicCnpj);
    const clinicPhoneNumber = onlyDigits(body.clinicPhoneNumber);
    const clinicAddress = body.clinicAddress?.trim();
    const clinicAddressNumber = body.clinicAddressNumber?.trim();
    const clinicAddressComplement = body.clinicAddressComplement?.trim() || null;
    const clinicPostalCode = onlyDigits(body.clinicPostalCode);
    const clinicProvince = body.clinicProvince?.trim();

    if (!sessionId) return NextResponse.json({ error: 'CHECKOUT_SESSION_NOT_FOUND' }, { status: 404 });

    const checkoutSession = await getCheckoutSessionById(sessionId);
    const onboarding = await getOnboardingBySessionId(sessionId);

    if (!checkoutSession || !onboarding) {
      return NextResponse.json({ error: 'CHECKOUT_SESSION_NOT_FOUND' }, { status: 404 });
    }

    if (checkoutSession.status !== 'paid') {
      return NextResponse.json({ error: 'CHECKOUT_SESSION_NOT_READY' }, { status: 409 });
    }

    if (onboarding.status === 'completed') {
      return NextResponse.json({ error: 'ONBOARDING_ALREADY_COMPLETED' }, { status: 409 });
    }

    if (!name) {
      return NextResponse.json({ error: 'MISSING_NAME' }, { status: 400 });
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'WEAK_PASSWORD' }, { status: 400 });
    }

    if (!clinicName) {
      return NextResponse.json({ error: 'MISSING_CLINIC_NAME' }, { status: 400 });
    }

    if (clinicCnpj.length !== 14) {
      return NextResponse.json({ error: 'INVALID_CLINIC_CNPJ' }, { status: 400 });
    }

    if (clinicPhoneNumber.length < 10) {
      return NextResponse.json({ error: 'INVALID_CLINIC_PHONE' }, { status: 400 });
    }

    if (!clinicAddress) {
      return NextResponse.json({ error: 'MISSING_CLINIC_ADDRESS' }, { status: 400 });
    }

    if (!clinicAddressNumber) {
      return NextResponse.json({ error: 'MISSING_CLINIC_ADDRESS_NUMBER' }, { status: 400 });
    }

    if (clinicPostalCode.length !== 8) {
      return NextResponse.json({ error: 'INVALID_CLINIC_POSTAL_CODE' }, { status: 400 });
    }

    if (!clinicProvince) {
      return NextResponse.json({ error: 'MISSING_CLINIC_PROVINCE' }, { status: 400 });
    }

    await beginOnboardingProcessing(sessionId);
    shouldResetProcessing = true;

    const adminAuth = getAdminAuth();
    let user;

    try {
      user = await adminAuth.createUser({
        displayName: name,
        email,
        password,
        emailVerified: false,
      });
    } catch (error: any) {
      if (error?.code === 'auth/email-already-exists') {
        throw new Error('USER_ALREADY_EXISTS');
      }
      throw error;
    }

    await upsertUserProfile({
      id: user.uid,
      email,
      name,
      image: null,
      emailVerified: false,
    });

    const clinic = await createClinicForUser({
      userId: user.uid,
      name: clinicName,
    });

    await updateClinicSettings(clinic.id, {
      cnpj: clinicCnpj,
      phoneNumber: clinicPhoneNumber,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      addressComplement: clinicAddressComplement,
      postalCode: clinicPostalCode,
      province: clinicProvince,
    });

    const syncedCustomer = await upsertAsaasCustomer({
      asaasCustomerId: checkoutSession.asaasCustomerId,
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
      externalReference: clinic.id,
    }).catch(() => null);

    if (syncedCustomer?.id && syncedCustomer.id !== checkoutSession.asaasCustomerId) {
      await updateCheckoutSession(checkoutSession.id, {
        asaasCustomerId: syncedCustomer.id,
      }).catch(() => null);
    }

    let nextAsaasSubscriptionId = checkoutSession.asaasSubscriptionId;

    if (checkoutSession.paymentMethod === 'boleto' && !nextAsaasSubscriptionId && syncedCustomer?.id) {
      const nextDueDate = new Date(checkoutSession.paidAt ?? new Date());
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      const boletoSubscription = await createAsaasSubscription({
        customerId: syncedCustomer.id,
        billingType: 'BOLETO',
        value: checkoutSession.value,
        description: `${checkoutSession.planName} - cobrança mensal`,
        nextDueDate,
        cycle: 'MONTHLY',
      }).catch(() => null);

      if (boletoSubscription?.id) {
        nextAsaasSubscriptionId = boletoSubscription.id;
        await updateCheckoutSession(checkoutSession.id, {
          asaasSubscriptionId: boletoSubscription.id,
          asaasCustomerId: syncedCustomer.id,
        }).catch(() => null);
      }
    }

    await updateUserAsaasSubscription(user.uid, {
      asaasCustomerId: syncedCustomer?.id ?? checkoutSession.asaasCustomerId,
      asaasSubscriptionId: nextAsaasSubscriptionId,
      asaasCheckoutId: checkoutSession.asaasCheckoutId,
      subscriptionStatus: 'active',
      plan: checkoutSession.planId,
    });

    await completeOnboardingForSession(sessionId, {
      userId: user.uid,
      clinicId: clinic.id,
    });
    shouldResetProcessing = false;

    return NextResponse.json({ ok: true, uid: user.uid, clinicId: clinic.id });
  } catch (error: any) {
    if (sessionId && shouldResetProcessing) {
      await resetOnboardingProcessing(sessionId).catch(() => null);
    }

    return NextResponse.json(
      {
        error: error?.message ?? 'REGISTER_FAILED',
        details: error?.message ?? 'Unknown register error',
      },
      { status: ['ONBOARDING_ALREADY_COMPLETED', 'ONBOARDING_NOT_RELEASED', 'CHECKOUT_SESSION_NOT_READY', 'USER_ALREADY_EXISTS'].includes(error?.message) ? 409 : error?.message === 'CHECKOUT_SESSION_NOT_FOUND' ? 404 : 500 },
    );
  }
};
