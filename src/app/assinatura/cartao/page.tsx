import { AuthShell } from '@/app/authentication/components/auth-shell';

import { PublicCardCheckoutStart } from '../_components/public-card-checkout-start';

export const dynamic = 'force-dynamic';

export default function AssinaturaCartaoPage() {
  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <PublicCardCheckoutStart paymentMethod="credit_card" />
    </AuthShell>
  );
}
