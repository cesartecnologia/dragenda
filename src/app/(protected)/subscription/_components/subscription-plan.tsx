'use client';

import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { createAsaasCheckout } from '@/actions/create-asaas-checkout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface SubscriptionPlanProps {
  active?: boolean;
  className?: string;
  userEmail: string;
  bypassSubscription?: boolean;
  subscriptionStatus?: string | null;
  nextRenewal?: string | null;
}

export function SubscriptionPlan({
  active = false,
  className,
  bypassSubscription = false,
  subscriptionStatus,
  nextRenewal,
}: SubscriptionPlanProps) {
  const checkoutAction = useAction(createAsaasCheckout, {
    onSuccess: ({ data }) => {
      if (!data?.checkoutUrl) {
        toast.error('Link de pagamento não encontrado.');
        return;
      }
      window.location.href = data.checkoutUrl;
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível abrir a contratação do plano.');
    },
  });

  const features = [
    'Cadastro ilimitado de médicos',
    'Agendamentos ilimitados',
    'Visão completa da rotina da clínica',
    'Cadastro completo de pacientes',
    'Gestão da equipe e atendimentos',
    'Suporte prioritário',
  ];

  const statusLabel = active
    ? 'Assinatura Premium ativa'
    : subscriptionStatus === 'overdue'
      ? 'Pagamento pendente'
      : subscriptionStatus === 'checkout_pending'
        ? 'Contratação em andamento'
        : 'Assinatura Premium';

  const ctaLabel = bypassSubscription
    ? 'Plano não exigido para seu perfil'
    : active
      ? 'Assinatura Premium ativa'
      : subscriptionStatus === 'checkout_pending'
        ? 'Continuar contratação'
        : 'Assinar plano Premium';

  return (
    <Card className={className}>
      <CardHeader className="space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">{statusLabel}</h3>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Tudo o que sua clínica precisa para organizar agenda, pacientes, equipe e atendimentos em um só lugar.
            </p>
          </div>

          {bypassSubscription ? (
            <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
              <ShieldCheck className="size-3.5" />
              Acesso Master
            </Badge>
          ) : active ? (
            <Badge className="w-fit bg-green-100 text-green-700 hover:bg-green-100">Ativa</Badge>
          ) : subscriptionStatus === 'checkout_pending' ? (
            <Badge className="w-fit bg-amber-100 text-amber-700 hover:bg-amber-100">Aguardando pagamento</Badge>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-8 sm:px-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-end justify-center gap-1.5">
              <span className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">R$ 99,90</span>
              <span className="pb-1 text-sm text-slate-500 sm:text-base">/mês</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Ideal para clínicas que querem concentrar agenda, pacientes, equipe e visão do negócio em uma única plataforma.
            </p>
            {nextRenewal ? (
              <div className="mt-5 w-full max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
                <span className="font-medium">Próxima renovação:</span> {nextRenewal}
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="border-t border-gray-200 pt-6">
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 rounded-xl">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl space-y-3">
          <Button
            className="h-11 w-full"
            variant={active || bypassSubscription ? 'outline' : 'default'}
            onClick={() => checkoutAction.execute()}
            disabled={checkoutAction.isExecuting || bypassSubscription || active}
          >
            {checkoutAction.isExecuting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-1 h-4 w-4" />
            )}
            {ctaLabel}
          </Button>

          {bypassSubscription ? (
            <p className="text-center text-xs text-muted-foreground">
              Seu perfil possui liberação administrativa e não depende de cobrança para acessar o sistema.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
