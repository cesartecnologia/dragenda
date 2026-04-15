import { NextResponse } from 'next/server';

export const POST = async () => {
  return NextResponse.json(
    {
      error: 'PAYMENT_REQUIRED_BEFORE_REGISTRATION',
      details: 'O cadastro da clínica e do administrador só pode acontecer após a confirmação do pagamento.',
    },
    { status: 403 },
  );
};
