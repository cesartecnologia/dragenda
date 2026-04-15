import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { SubscriptionPlan } from '@/app/(protected)/subscription/_components/subscription-plan';
import { canAccessFinancial } from '@/lib/access';
import { getServerSession, requireSession } from '@/lib/auth';
import { getSubscriptionSummaryForUser } from '@/server/subscription-data';

import { AutoStartCheckout } from './_components/auto-start-checkout';
import { CheckoutSuccessSync } from './_components/checkout-success-sync';
import { PublicSubscriptionView } from './_components/public-subscription-view';
import { SubscriptionManager } from './_components/subscription-manager';

const formatRenewalDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  const params = (await searchParams) ?? {};
  const checkoutState = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 sm:gap-5">
          {checkoutState === 'error' ? (
            <Badge className="mx-auto w-fit rounded-full bg-amber-100 px-4 py-1.5 text-amber-700 hover:bg-amber-100">
              Não foi possível iniciar o pagamento agora. Tente novamente em instantes.
            </Badge>
          ) : null}
          <PublicSubscriptionView />
        </div>
      </div>
    );
  }

  if (session.user.mustChangePassword) {
    redirect('/primeiro-login');
  }

  if (!session.user.bypassSubscription && !canAccessFinancial(session.user.role)) {
    redirect('/agendamentos');
  }

  const firstAccess = Array.isArray(params.firstAccess) ? params.firstAccess[0] : params.firstAccess;
  const startCheckout = Array.isArray(params.startCheckout) ? params.startCheckout[0] : params.startCheckout;
  const summary = await getSubscriptionSummaryForUser(session.user.id);
  const nextRenewal = formatRenewalDate(summary.subscription?.nextDueDate ?? summary.latestPayment?.dueDate ?? null);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Assinatura Premium</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe o status do plano da sua clínica.</p>
        </div>

        {startCheckout === '1' && !summary.accessReleased && !session.user.bypassSubscription ? <AutoStartCheckout /> : null}

        {firstAccess === '1' ? (
          <Badge className="mx-auto w-fit rounded-full bg-blue-100 px-4 py-1.5 text-blue-700 hover:bg-blue-100">
            Cadastro concluído. Falta apenas finalizar a assinatura.
          </Badge>
        ) : null}
        {checkoutState === 'success' ? (
          <>
            <CheckoutSuccessSync />
            <Badge className="mx-auto w-fit rounded-full bg-emerald-100 px-4 py-1.5 text-emerald-700 hover:bg-emerald-100">
              Pagamento concluído. Estamos validando sua assinatura.
            </Badge>
          </>
        ) : null}
        {checkoutState === 'cancelled' ? (
          <Badge className="mx-auto w-fit rounded-full bg-amber-100 px-4 py-1.5 text-amber-700 hover:bg-amber-100">
            O pagamento foi cancelado. Gere um novo link quando quiser continuar.
          </Badge>
        ) : null}
        {checkoutState === 'expired' ? (
          <Badge className="mx-auto w-fit rounded-full bg-slate-100 px-4 py-1.5 text-slate-700 hover:bg-slate-100">
            O link de pagamento expirou. Gere um novo link para continuar.
          </Badge>
        ) : null}

        <SubscriptionPlan
          active={summary.accessReleased}
          bypassSubscription={session.user.bypassSubscription}
          userEmail={session.user.email}
          subscriptionStatus={summary.resolvedStatus ?? summary.storedStatus}
          nextRenewal={nextRenewal}
          className="mx-auto w-full max-w-2xl"
        />

        <div className="mx-auto w-full max-w-2xl">
          <SubscriptionManager canCancel={Boolean(summary.asaasSubscriptionId)} bypassSubscription={session.user.bypassSubscription} />
        </div>
      </div>
    </div>
  );
}
