import { NextResponse } from 'next/server';

export const POST = async () => {
  return NextResponse.json(
    {
      error: 'PRE_PAYMENT_SIGNUP_DISABLED',
      details: 'O cadastro da clínica e do usuário só pode acontecer após a confirmação do pagamento.',
    },
    { status: 403 },
  );
};
