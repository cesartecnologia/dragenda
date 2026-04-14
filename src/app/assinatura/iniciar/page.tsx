import { redirect } from 'next/navigation';

import { createPendingSignupIntent, attachCheckoutToPendingSignup } from '@/server/pending-signups';
import { createAsaasRecurringCheckout } from '@/lib/asaas';
import { getServerSession } from '@/lib/auth';

const PLAN_LABEL = 'Plano Premium';
const PLAN_VALUE = Number(process.env.ASAAS_PLAN_VALUE ?? '99.90');

export default async function IniciarAssinaturaPage() {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/assinatura?startCheckout=1');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL não configurado.');
  }

  const intent = await createPendingSignupIntent();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

  const checkout = await createAsaasRecurringCheckout({
    planName: PLAN_LABEL,
    description: 'Assinatura mensal para liberar o acesso completo da clínica.',
    value: PLAN_VALUE,
    successUrl: `${appUrl}/primeiro-acesso?intentId=${intent.id}&checkout=success`,
    cancelUrl: `${appUrl}/assinatura?checkout=cancelled`,
    expiredUrl: `${appUrl}/assinatura?checkout=expired`,
  });

  await attachCheckoutToPendingSignup(intent.id, checkout.id);

  redirect(checkout.checkoutUrl);
}
