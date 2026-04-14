import { NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase-admin';
import { upsertAsaasCustomer } from '@/lib/asaas';
import { createClinicForUser, updateClinicSettings, updateUserAsaasSubscription, upsertUserProfile } from '@/server/clinic-data';
import { completePendingSignup, getPendingSignupById } from '@/server/pending-signups';

const validateEmail = (email: string) => /.+@.+\..+/.test(email);
const onlyDigits = (value?: string) => (value ?? '').replace(/\D/g, '');

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as {
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

    const intentId = body.intentId?.trim();
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

    if (!intentId) return NextResponse.json({ error: 'PENDING_SIGNUP_NOT_FOUND' }, { status: 404 });

    const pendingSignup = await getPendingSignupById(intentId);
    if (!pendingSignup) {
      return NextResponse.json({ error: 'PENDING_SIGNUP_NOT_FOUND' }, { status: 404 });
    }

    if (pendingSignup.status !== 'checkout_paid') {
      return NextResponse.json({ error: 'PENDING_SIGNUP_NOT_READY' }, { status: 409 });
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
        return NextResponse.json({ error: 'USER_ALREADY_EXISTS' }, { status: 409 });
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

    const syncedCustomer = pendingSignup.asaasCustomerId
      ? await upsertAsaasCustomer({
          asaasCustomerId: pendingSignup.asaasCustomerId,
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
      asaasCustomerId: syncedCustomer?.id ?? pendingSignup.asaasCustomerId,
      asaasSubscriptionId: pendingSignup.asaasSubscriptionId,
      asaasCheckoutId: pendingSignup.checkoutId,
      subscriptionStatus: 'active',
      plan: 'essential',
    });

    await completePendingSignup(intentId, {
      userId: user.uid,
      clinicId: clinic.id,
    });

    return NextResponse.json({ ok: true, uid: user.uid, clinicId: clinic.id });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'REGISTER_FAILED',
        details: error?.message ?? 'Unknown register error',
      },
      { status: 500 },
    );
  }
};
