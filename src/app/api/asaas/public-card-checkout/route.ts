import { NextResponse } from 'next/server';

import { createPublicCardCheckoutSession } from '@/server/public-checkout';

export const POST = async () => {
  try {
    const checkout = await createPublicCardCheckoutSession();

    return NextResponse.json({ ok: true, ...checkout });
  } catch (error) {
    console.error('PUBLIC_CARD_CHECKOUT_FAILED', error);
    return NextResponse.json({ error: 'Nao foi possivel iniciar o pagamento agora.' }, { status: 500 });
  }
};
