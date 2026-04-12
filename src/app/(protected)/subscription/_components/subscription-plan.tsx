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
  asaasSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
}

export function SubscriptionPlan({
  active = false,
  className,
  bypassSubscription = false,
  asaasSubscriptionId,
  subscriptionStatus,
}: SubscriptionPlanProps) {
  const checkoutAction = useAction(createAsaasCheckout, {
    onSuccess: ({ data }) => {
      if (!data?.checkoutUrl) throw new Error('Link do checkout não encontrado.');
      window.location.href = data.checkoutUrl;
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível gerar o checkout da assinatura.');
    },
  });

  const features = [
    'Cadastro ilimitado de médicos',
    'Agendamentos ilimitados',
    'Dashboard com métricas da clínica',
    'Cadastro completo de pacientes',
    'Gestão de agenda e atendimento',
    'Suporte prioritário via e-mail',
  ];

  const statusLabel = active
    ? 'Assinatura ativa'
    : subscriptionStatus === 'overdue'
      ? 'Pagamento em atraso'
      : subscriptionStatus === 'checkout_pending'
        ? 'Checkout em aberto'
        : 'Plano Profissional';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{statusLabel}</h3>
            <p className="mt-1 text-sm text-primary">Cobrança recorrente via Asaas</p>
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
        <p className="text-gray-600">Tenha acesso completo ao sistema, com gestão clínica, agenda e métricas.</p>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">R$99</span>
          <span className="ml-1 text-gray-600">/ mês</span>
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
            O acesso da clínica é liberado automaticamente quando o Asaas confirmar o pagamento da assinatura.
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
            {bypassSubscription
              ? 'Plano não exigido para seu perfil'
              : active
                ? 'Assinatura ativa no Asaas'
                : subscriptionStatus === 'checkout_pending'
                  ? 'Gerar novo checkout Asaas'
                  : 'Assinar plano pelo Asaas'}
          </Button>

          {asaasSubscriptionId ? (
            <p className="text-center text-xs text-muted-foreground">Assinatura vinculada: {asaasSubscriptionId}</p>
          ) : null}

          {bypassSubscription ? (
            <p className="text-center text-xs text-muted-foreground">
              Seu perfil Master/Suporte ignora o bloqueio comercial e pode acessar o sistema sem assinatura ativa.
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Cobrança recorrente mensal com confirmação e bloqueio automáticos via webhook do Asaas.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
