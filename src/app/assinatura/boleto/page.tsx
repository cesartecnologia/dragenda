import { AuthShell } from '@/app/authentication/components/auth-shell';

import { BoletoSubscriptionForm } from '../_components/boleto-subscription-form';

export default function AssinaturaBoletoPage() {
  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <BoletoSubscriptionForm />
    </AuthShell>
  );
}
