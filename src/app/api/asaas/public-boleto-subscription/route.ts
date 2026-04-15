import { NextResponse } from 'next/server';

import { startPublicCheckout } from '@/server/public-checkout';

export const POST = async () => {
  try {
    const checkout = await startPublicCheckout('boleto');
    return NextResponse.json({ ok: true, checkoutUrl: checkout.checkoutUrl, sessionId: checkout.sessionId });
  } catch (error) {
    console.error('PUBLIC_BOLETO_CHECKOUT_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível abrir a página de pagamento agora.' }, { status: 500 });
  }
};
