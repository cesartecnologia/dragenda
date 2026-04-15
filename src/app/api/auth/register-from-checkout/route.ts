import { NextResponse } from 'next/server';

import { getAdminAuth, getFirestoreDb } from '@/lib/firebase-admin';
import { upsertAsaasCustomer } from '@/lib/asaas';
import { createClinicForUser, updateClinicSettings, updateUserAsaasSubscription, upsertUserProfile } from '@/server/clinic-data';
import {
  claimOnboardingForProvisioning,
  completeOnboarding,
  getCheckoutSessionById,
  getOnboardingBySessionId,
  revertOnboardingProvisioning,
} from '@/server/checkout-sessions';
import { completePendingSignup, getPendingSignupById } from '@/server/pending-signups';

const validateEmail = (email: string) => /.+@.+\..+/.test(email);
const onlyDigits = (value?: string) => (value ?? '').replace(/\D/g, '');

const toErrorResponse = (code: string, status: number, details?: string) =>
  NextResponse.json(details ? { error: code, details } : { error: code }, { status });

export const POST = async (request: Request) => {
  let createdUserId: string | null = null;
  let createdClinicId: string | null = null;
  let currentSessionId: string | null = null;

  try {
    const body = (await request.json()) as {
      sessionId?: string;
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

    const sessionId = body.sessionId?.trim();
    currentSessionId = sessionId ?? null;
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

    if (!sessionId) return toErrorResponse('CHECKOUT_SESSION_NOT_FOUND', 404);

    const checkoutSession = await getCheckoutSessionById(sessionId);
    const legacyPendingSignup = checkoutSession ? null : await getPendingSignupById(sessionId);

    if (!checkoutSession && !legacyPendingSignup) {
      return toErrorResponse('CHECKOUT_SESSION_NOT_FOUND', 404);
    }

    if (checkoutSession && checkoutSession.status !== 'paid') {
      return toErrorResponse('CHECKOUT_SESSION_NOT_READY', 409);
    }

    if (legacyPendingSignup && legacyPendingSignup.status !== 'checkout_paid') {
      return toErrorResponse('CHECKOUT_SESSION_NOT_READY', 409);
    }

    const onboarding = checkoutSession ? await getOnboardingBySessionId(sessionId) : null;
    if (checkoutSession && !onboarding) {
      return toErrorResponse('ONBOARDING_NOT_FOUND', 404);
    }

    if (onboarding?.status === 'completed') {
      return NextResponse.json({ ok: true, uid: onboarding.userId, clinicId: onboarding.clinicId, alreadyCompleted: true });
    }

    if (!name) {
      return toErrorResponse('MISSING_NAME', 400);
    }

    if (!email || !validateEmail(email)) {
      return toErrorResponse('INVALID_EMAIL', 400);
    }

    if (!password || password.length < 8) {
      return toErrorResponse('WEAK_PASSWORD', 400);
    }

    if (!clinicName) {
      return toErrorResponse('MISSING_CLINIC_NAME', 400);
    }

    if (clinicCnpj.length !== 14) {
      return toErrorResponse('INVALID_CLINIC_CNPJ', 400);
    }

    if (clinicPhoneNumber.length < 10) {
      return toErrorResponse('INVALID_CLINIC_PHONE', 400);
    }

    if (!clinicAddress) {
      return toErrorResponse('MISSING_CLINIC_ADDRESS', 400);
    }

    if (!clinicAddressNumber) {
      return toErrorResponse('MISSING_CLINIC_ADDRESS_NUMBER', 400);
    }

    if (clinicPostalCode.length !== 8) {
      return toErrorResponse('INVALID_CLINIC_POSTAL_CODE', 400);
    }

    if (!clinicProvince) {
      return toErrorResponse('MISSING_CLINIC_PROVINCE', 400);
    }

    if (checkoutSession) {
      try {
        await claimOnboardingForProvisioning(sessionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ONBOARDING_LOCKED';
        if (message === 'ONBOARDING_IN_PROGRESS') return toErrorResponse('ONBOARDING_IN_PROGRESS', 409);
        if (message === 'ONBOARDING_NOT_FOUND') return toErrorResponse('ONBOARDING_NOT_FOUND', 404);
        return toErrorResponse('CHECKOUT_SESSION_NOT_READY', 409);
      }
    }

    const adminAuth = getAdminAuth();
    let user;

    try {
      user = await adminAuth.createUser({
        displayName: name,
        email,
        password,
        emailVerified: false,
      });
      createdUserId = user.uid;
    } catch (error: any) {
      if (error?.code === 'auth/email-already-exists') {
        if (checkoutSession) await revertOnboardingProvisioning(sessionId);
        return toErrorResponse('USER_ALREADY_EXISTS', 409);
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
    createdClinicId = clinic.id;

    await updateClinicSettings(clinic.id, {
      cnpj: clinicCnpj,
      phoneNumber: clinicPhoneNumber,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      addressComplement: clinicAddressComplement,
      postalCode: clinicPostalCode,
      province: clinicProvince,
    });

    const syncedCustomer = (checkoutSession?.asaasCustomerId ?? legacyPendingSignup?.asaasCustomerId)
      ? await upsertAsaasCustomer({
          asaasCustomerId: checkoutSession?.asaasCustomerId ?? legacyPendingSignup?.asaasCustomerId,
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
        }).catch(() => null)
      : null;

    await updateUserAsaasSubscription(user.uid, {
      asaasCustomerId: syncedCustomer?.id ?? checkoutSession?.asaasCustomerId ?? legacyPendingSignup?.asaasCustomerId,
      asaasSubscriptionId: checkoutSession?.asaasSubscriptionId ?? legacyPendingSignup?.asaasSubscriptionId,
      asaasCheckoutId: checkoutSession?.checkoutId ?? legacyPendingSignup?.checkoutId,
      subscriptionStatus: 'active',
      plan: checkoutSession?.planId ?? 'essential',
    });

    if (checkoutSession) {
      await completeOnboarding(sessionId, {
        userId: user.uid,
        clinicId: clinic.id,
      });
    } else {
      await completePendingSignup(sessionId, {
        userId: user.uid,
        clinicId: clinic.id,
      });
    }

    return NextResponse.json({ ok: true, uid: user.uid, clinicId: clinic.id });
  } catch (error: any) {
    if (createdClinicId) {
      await getFirestoreDb().collection('clinics').doc(createdClinicId).delete().catch(() => null);
    }

    if (createdUserId) {
      await getFirestoreDb().collection('users').doc(createdUserId).delete().catch(() => null);
      await getAdminAuth().deleteUser(createdUserId).catch(() => null);
    }

    if (currentSessionId) {
      await revertOnboardingProvisioning(currentSessionId).catch(() => null);
    }

    return NextResponse.json(
      {
        error: 'REGISTER_FAILED',
        details: error?.message ?? 'Unknown register error',
      },
      { status: 500 },
    );
  }
};
