'use client';

import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
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
    'Dashboard com métricas da clínica',
    'Cadastro completo de pacientes',
    'Gestão de agenda e atendimento',
    'Suporte prioritário',
  ];

  const statusLabel = active
    ? 'Assinatura Premium ativa'
    : subscriptionStatus === 'overdue'
      ? 'Pagamento pendente'
      : subscriptionStatus === 'checkout_pending'
        ? 'Contratação em andamento'
        : 'Plano Premium';

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
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Plano principal da clínica
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{statusLabel}</h3>
              <p className="mt-1 text-sm text-gray-600">Tenha acesso completo aos principais recursos da Clínica Smart.</p>
            </div>
          </div>
          {bypassSubscription ? (
            <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
              <ShieldCheck className="size-3.5" />
              Acesso Master
            </Badge>
          ) : active ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativa</Badge>
          ) : subscriptionStatus === 'checkout_pending' ? (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Aguardando pagamento</Badge>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-slate-900">R$ 99,90</span>
            <span className="text-sm text-slate-500">/mês</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ideal para clínicas que querem concentrar agenda, pacientes, equipe e visão do negócio em uma única plataforma.
          </p>
          {nextRenewal ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <span className="font-medium">Próxima renovação:</span> {nextRenewal}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 border-t border-gray-200 pt-6">
          {features.map((feature) => (
            <div key={feature} className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="ml-3 text-gray-600">{feature}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Sua clínica continua com acesso ativo enquanto a assinatura estiver regularizada.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full"
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
