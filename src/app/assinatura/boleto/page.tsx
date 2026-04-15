import { AuthShell } from '@/app/authentication/components/auth-shell';

import { PublicCardCheckoutStart } from '../_components/public-card-checkout-start';

export const dynamic = 'force-dynamic';

export default function AssinaturaBoletoPage() {
  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <PublicCardCheckoutStart paymentMethod="boleto" />
    </AuthShell>
  );
}
