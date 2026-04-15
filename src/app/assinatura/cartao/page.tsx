import { AuthShell } from '@/app/authentication/components/auth-shell';

import { PublicCardCheckoutStart } from '../_components/public-card-checkout-start';

export default function AssinaturaCartaoPage() {
  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <PublicCardCheckoutStart paymentMethod="credit_card" />
    </AuthShell>
  );
}
