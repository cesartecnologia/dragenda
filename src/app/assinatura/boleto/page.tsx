import { AuthShell } from '@/app/authentication/components/auth-shell';

import { PublicBoletoCheckoutForm } from '../_components/public-boleto-checkout-form';

export const dynamic = 'force-dynamic';

export default function AssinaturaBoletoPage() {
  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <PublicBoletoCheckoutForm variant="page" />
    </AuthShell>
  );
}
