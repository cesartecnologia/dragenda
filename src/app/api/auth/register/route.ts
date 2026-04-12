import { NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase-admin';
import { createClinicForUser, upsertUserProfile } from '@/server/clinic-data';

const validateEmail = (email: string) => /.+@.+\..+/.test(email);
const onlyDigits = (value?: string) => (value ?? '').replace(/\D/g, '');

export const POST = async (request: Request) => {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      clinicName?: string;
      clinicCnpj?: string;
      clinicPhoneNumber?: string;
      clinicAddress?: string;
      clinicAddressNumber?: string;
      clinicAddressComplement?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const clinicName = body.clinicName?.trim();
    const clinicCnpj = onlyDigits(body.clinicCnpj);
    const clinicPhoneNumber = onlyDigits(body.clinicPhoneNumber);
    const clinicAddress = body.clinicAddress?.trim();
    const clinicAddressNumber = body.clinicAddressNumber?.trim();
    const clinicAddressComplement = body.clinicAddressComplement?.trim() || null;

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

    if (!clinicCnpj || clinicCnpj.length !== 14) {
      return NextResponse.json({ error: 'MISSING_CLINIC_CNPJ' }, { status: 400 });
    }

    if (!clinicPhoneNumber || clinicPhoneNumber.length < 10) {
      return NextResponse.json({ error: 'MISSING_CLINIC_PHONE' }, { status: 400 });
    }

    if (!clinicAddress) {
      return NextResponse.json({ error: 'MISSING_CLINIC_ADDRESS' }, { status: 400 });
    }

    if (!clinicAddressNumber) {
      return NextResponse.json({ error: 'MISSING_CLINIC_ADDRESS_NUMBER' }, { status: 400 });
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

    await createClinicForUser({
      userId: user.uid,
      name: clinicName,
      cnpj: clinicCnpj,
      phoneNumber: clinicPhoneNumber,
      address: clinicAddress,
      addressNumber: clinicAddressNumber,
      addressComplement: clinicAddressComplement,
    });

    return NextResponse.json({ ok: true, uid: user.uid });
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
