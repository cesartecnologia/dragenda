import { NextResponse } from 'next/server';

export const POST = async () => {
  return NextResponse.json(
    {
      received: false,
      provider: 'stripe',
      disabled: true,
      message: 'Webhook do Stripe desabilitado. Use o webhook do Asaas.',
    },
    { status: 410 },
  );
};
