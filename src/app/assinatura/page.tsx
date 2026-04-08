import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireSession } from '@/lib/auth';
import { formatCurrency } from '@/helpers/currency';
import { SubscriptionPlan } from '@/app/(protected)/subscription/_components/subscription-plan';
import { SubscriptionManager } from '@/app/assinatura/_components/subscription-manager';
import { getSubscriptionSummaryForUser } from '@/server/subscription-data';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativa', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  pending: { label: 'Aguardando cobrança', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  checkout_pending: { label: 'Checkout em aberto', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  overdue: { label: 'Em atraso', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  cancelled: { label: 'Cancelada', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  refunded: { label: 'Estornada', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  deleted: { label: 'Removida', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  inactive: { label: 'Inativa', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
};

const paymentStatusLabel: Record<string, string> = {
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  PENDING: 'Pendente',
  OVERDUE: 'Vencido',
  REFUNDED: 'Estornado',
  DELETED: 'Removido',
  RECEIVED_IN_CASH: 'Recebido em dinheiro',
  RECEIVED_AWAITING_CLEARING: 'Compensando',
};

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};
  const checkoutState = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;
  const summary = await getSubscriptionSummaryForUser(session.user.id);

  const resolvedStatus = summary.resolvedStatus ?? 'checkout_pending';
  const statusInfo = statusMap[resolvedStatus] ?? {
    label: 'Sem assinatura',
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Assinatura da clínica</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe o status comercial, sincronize o Asaas e gerencie a assinatura mensal.</p>
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

          <div className="grid gap-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Status operacional</CardTitle>
                <CardDescription>Resumo da assinatura vinculada à clínica.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                  {summary.accessReleased ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Acesso liberado</Badge>
                  ) : (
                    <Badge variant="secondary">Acesso bloqueado até confirmação</Badge>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Clínica</p>
                    <p className="mt-2 text-sm font-medium">{summary.clinicName ?? 'Não vinculada'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cliente Asaas</p>
                    <p className="mt-2 break-all text-sm font-medium">{summary.asaasCustomerId ?? 'Ainda não gerado'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Assinatura</p>
                    <p className="mt-2 break-all text-sm font-medium">{summary.asaasSubscriptionId ?? 'Ainda não vinculada'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Próximo vencimento</p>
                    <p className="mt-2 text-sm font-medium">{formatDate(summary.subscription?.nextDueDate ?? summary.latestPayment?.dueDate)}</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <p>
                    Use <strong>Sincronizar com Asaas</strong> para puxar o status mais recente manualmente. Se a assinatura estiver cancelada ou em atraso, gere um novo checkout para reativar o acesso.
                  </p>
                </div>

                <SubscriptionManager
                  canCancel={Boolean(summary.asaasSubscriptionId && !session.user.bypassSubscription)}
                  bypassSubscription={session.user.bypassSubscription}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Cobranças recentes</CardTitle>
                <CardDescription>Últimas cobranças geradas para a assinatura da clínica.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {summary.payments.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 font-medium">Vencimento</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Forma</th>
                          <th className="pb-3 font-medium text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.payments.slice(0, 8).map((payment) => (
                          <tr key={payment.id} className="border-b last:border-0">
                            <td className="py-3">{formatDate(payment.dueDate ?? payment.dateCreated)}</td>
                            <td className="py-3">{paymentStatusLabel[payment.status ?? ''] ?? (payment.status ?? '—')}</td>
                            <td className="py-3">{payment.billingType ?? '—'}</td>
                            <td className="py-3 text-right font-medium">{formatCurrency(payment.value ?? null)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Ainda não encontramos cobranças dessa assinatura. Assim que o Asaas gerar ou atualizar a recorrência, elas aparecerão aqui.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
