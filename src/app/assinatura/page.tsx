import { Badge } from '@/components/ui/badge';
import { requireSession } from '@/lib/auth';
import { SubscriptionPlan } from '@/app/(protected)/subscription/_components/subscription-plan';
import { getSubscriptionSummaryForUser } from '@/server/subscription-data';

import { CheckoutSuccessSync } from './_components/checkout-success-sync';
import { SubscriptionManager } from './_components/subscription-manager';

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};
  const checkoutState = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;
  const firstAccess = Array.isArray(params.firstAccess) ? params.firstAccess[0] : params.firstAccess;
  const summary = await getSubscriptionSummaryForUser(session.user.id);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Assinatura da clínica</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gerencie apenas a assinatura mensal da clínica.</p>
        </div>

        {firstAccess === '1' ? (
          <Badge className="mx-auto w-fit rounded-full bg-blue-100 px-4 py-1.5 text-blue-700 hover:bg-blue-100">
            Primeiro acesso concluído. Falta apenas ativar a assinatura para liberar o sistema.
          </Badge>
        ) : null}
        {checkoutState === 'success' ? (
          <>
            <CheckoutSuccessSync />
            <Badge className="mx-auto w-fit rounded-full bg-emerald-100 px-4 py-1.5 text-emerald-700 hover:bg-emerald-100">
              Checkout concluído. Estamos sincronizando a confirmação do Asaas para liberar o acesso.
            </Badge>
          </>
        ) : null}
        {checkoutState === 'cancelled' ? (
          <Badge className="mx-auto w-fit rounded-full bg-amber-100 px-4 py-1.5 text-amber-700 hover:bg-amber-100">
            O checkout foi cancelado. Gere um novo link quando quiser.
          </Badge>
        ) : null}
        {checkoutState === 'expired' ? (
          <Badge className="mx-auto w-fit rounded-full bg-slate-100 px-4 py-1.5 text-slate-700 hover:bg-slate-100">
            O checkout expirou. Gere um novo link para continuar.
          </Badge>
        ) : null}

        <SubscriptionPlan
          active={summary.accessReleased}
          bypassSubscription={session.user.bypassSubscription}
          userEmail={session.user.email}
          asaasSubscriptionId={summary.asaasSubscriptionId}
          subscriptionStatus={summary.resolvedStatus ?? summary.storedStatus}
          className="mx-auto w-full max-w-2xl"
        />

        <div className="mx-auto w-full max-w-2xl">
          <SubscriptionManager canCancel={Boolean(summary.asaasSubscriptionId)} bypassSubscription={session.user.bypassSubscription} />
        </div>
      </div>
    </div>
  );
}
