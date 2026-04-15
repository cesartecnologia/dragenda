import { AuthShell } from '@/app/authentication/components/auth-shell';

import { CardSubscriptionForm } from '../_components/card-subscription-form';

export default function AssinaturaCartaoPage() {
  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <CardSubscriptionForm />
    </AuthShell>
  );
}
