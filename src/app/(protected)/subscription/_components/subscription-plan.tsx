'use client';

import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { createStripeCheckout } from '@/actions/create-stripe-checkout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface SubscriptionPlanProps {
  active?: boolean;
  className?: string;
  userEmail: string;
  bypassSubscription?: boolean;
}

export function SubscriptionPlan({
  active = false,
  className,
  userEmail,
  bypassSubscription = false,
}: SubscriptionPlanProps) {
  const router = useRouter();
  const createStripeCheckoutAction = useAction(createStripeCheckout, {
    onSuccess: async ({ data }) => {
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe publishable key not found');
      }
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) {
        throw new Error('Stripe not found');
      }
      if (!data?.sessionId) {
        throw new Error('Session ID not found');
      }
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
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

  const handleSubscribeClick = () => {
    createStripeCheckoutAction.execute();
  };

  const handleManagePlanClick = () => {
    router.push(`${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}?prefilled_email=${userEmail}`);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Plano Profissional</h3>
            <p className="mt-1 text-sm text-primary">Ideal para clínicas e consultórios em crescimento</p>
          </div>
          {bypassSubscription ? (
            <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
              <ShieldCheck className="size-3.5" />
              Acesso Master
            </Badge>
          ) : active ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Atual</Badge>
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
          <p className="font-medium text-foreground">Profissionais que usam o sistema economizam em média 15 horas por semana em tarefas administrativas.</p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full"
            variant={active || bypassSubscription ? 'outline' : 'default'}
            onClick={active ? handleManagePlanClick : handleSubscribeClick}
            disabled={createStripeCheckoutAction.isExecuting || bypassSubscription}
          >
            {createStripeCheckoutAction.isExecuting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : bypassSubscription ? (
              'Plano não exigido para seu perfil'
            ) : active ? (
              'Gerenciar assinatura'
            ) : (
              'Assinar plano por R$99/mês'
            )}
          </Button>
          {bypassSubscription ? (
            <p className="text-center text-xs text-muted-foreground">
              Seu perfil Master/Suporte ignora o bloqueio comercial e pode acessar o sistema sem assinatura ativa.
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Garantia de 30 dias. Cancele quando quiser.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
