import { NextResponse } from 'next/server';

import { startPublicBoletoCheckout } from '@/server/public-checkout';

const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '');
const validateEmail = (value: string) => /.+@.+\..+/.test(value);

export const POST = async (request: Request) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      cpfCnpj?: string;
      phone?: string;
    };

    const name = body.name?.trim() ?? '';
    const email = body.email?.trim().toLowerCase() ?? '';
    const cpfCnpj = onlyDigits(body.cpfCnpj);
    const phone = onlyDigits(body.phone);

    if (!name) {
      return NextResponse.json({ error: 'Informe o nome do responsável.' }, { status: 400 });
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
    }

    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return NextResponse.json({ error: 'Informe um CPF ou CNPJ válido.' }, { status: 400 });
    }

    if (phone.length < 10) {
      return NextResponse.json({ error: 'Informe um telefone válido.' }, { status: 400 });
    }

    const checkout = await startPublicBoletoCheckout({
      name,
      email,
      cpfCnpj,
      phone,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: checkout.checkoutUrl,
      invoiceUrl: checkout.invoiceUrl,
      sessionId: checkout.sessionId,
    });
  } catch (error) {
    console.error('PUBLIC_BOLETO_CHECKOUT_FAILED', error);
    return NextResponse.json({ error: 'Não foi possível gerar o boleto agora.' }, { status: 500 });
  }
};
