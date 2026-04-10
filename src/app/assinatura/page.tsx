import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth';
import { SubscriptionPlan } from '@/app/(protected)/subscription/_components/subscription-plan';
import { SubscriptionManager } from '@/app/assinatura/_components/subscription-manager';
import { getSubscriptionSummaryForUser } from '@/server/subscription-data';

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};
  const checkoutState = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;
  const summary = await getSubscriptionSummaryForUser(session.user.id);

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Assinatura da clínica</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gerencie a assinatura mensal da clínica e gere um novo checkout quando necessário.</p>
        </div>

        {checkoutState === 'success' ? (
          <Badge className="w-fit rounded-full bg-emerald-100 px-4 py-1.5 text-emerald-700 hover:bg-emerald-100">
            Checkout concluído. Agora basta aguardar a confirmação do Asaas para liberar o acesso.
          </Badge>
        ) : null}
        {checkoutState === 'cancelled' ? (
          <Badge className="w-fit rounded-full bg-amber-100 px-4 py-1.5 text-amber-700 hover:bg-amber-100">
            O checkout foi cancelado. Gere um novo link quando quiser.
          </Badge>
        ) : null}
        {checkoutState === 'expired' ? (
          <Badge className="w-fit rounded-full bg-slate-100 px-4 py-1.5 text-slate-700 hover:bg-slate-100">
            O checkout expirou. Gere um novo link para continuar.
          </Badge>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <SubscriptionPlan
            active={summary.accessReleased}
            bypassSubscription={session.user.bypassSubscription}
            userEmail={session.user.email}
            asaasSubscriptionId={summary.asaasSubscriptionId}
            subscriptionStatus={summary.resolvedStatus ?? summary.storedStatus}
          />

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Gerenciar assinatura</CardTitle>
              <CardDescription>Use as ações abaixo para atualizar ou cancelar a assinatura da clínica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                <p>
                  Sempre que precisar, você pode sincronizar o status com o Asaas ou gerar um novo checkout para continuar a assinatura da clínica.
                </p>
              </div>

              <SubscriptionManager
                canCancel={Boolean(summary.asaasSubscriptionId && !session.user.bypassSubscription)}
                bypassSubscription={session.user.bypassSubscription}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
