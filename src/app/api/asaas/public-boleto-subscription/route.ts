import { NextResponse } from 'next/server';

import { startPublicBoletoCheckout } from '@/server/public-checkout';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'Não foi possível gerar o boleto agora.';
};

export const POST = async () => {
  try {
    const checkout = await startPublicBoletoCheckout();

    return NextResponse.json({
      ok: true,
      checkoutUrl: checkout.checkoutUrl,
      invoiceUrl: checkout.invoiceUrl,
      sessionId: checkout.sessionId,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('PUBLIC_BOLETO_CHECKOUT_FAILED', error);

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: message.includes('não configurado') ? 500 : 502,
      },
    );
  }
};
