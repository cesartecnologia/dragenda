import { redirect } from 'next/navigation';

import { AuthShell } from '@/app/authentication/components/auth-shell';
import { createPublicCardCheckoutSession } from '@/server/public-checkout';

import { PublicCardCheckoutStart } from '../_components/public-card-checkout-start';

export default async function AssinaturaCartaoPage() {
  try {
    const checkout = await createPublicCardCheckoutSession();
    redirect(checkout.checkoutUrl);
  } catch (error) {
    console.error('ASSINATURA_CARTAO_PAGE_FAILED', error);

    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Area do cliente" mode="single">
        <PublicCardCheckoutStart error="Nao conseguimos abrir o pagamento agora. Tente novamente em alguns instantes." />
      </AuthShell>
    );
  }
}
