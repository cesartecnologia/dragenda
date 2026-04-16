import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, CreditCard, FileText, ShieldCheck, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { PublicCheckoutButton } from './public-checkout-button';

type PublicSubscriptionViewProps = {
  source?: 'subscription' | 'login';
};

const features = [
  'Agenda, pacientes e equipe em um só lugar.',
  'Cadastros e agendamentos sem limite.',
  'Suporte para acompanhar sua operação.',
  'Cadastro liberado após a confirmação do pagamento.',
] as const;

const methods = [
  {
    title: 'Cartão de crédito',
    description: 'Pagamento online na hora.',
    buttonLabel: 'Pagar com cartão',
    icon: CreditCard,
    buttonVariant: 'default' as const,
    accent: 'bg-slate-900',
    iconBg: 'bg-slate-100 text-slate-700',
    paymentMethod: 'credit_card' as const,
  },
  {
    title: 'Boleto bancário',
    description: 'Pague por boleto e continue o cadastro depois.',
    buttonLabel: 'Gerar boleto',
    icon: FileText,
    buttonVariant: 'outline' as const,
    accent: 'bg-amber-500',
    iconBg: 'bg-amber-100 text-amber-700',
    paymentMethod: 'boleto' as const,
  },
] as const;

export function PublicSubscriptionView({ source = 'subscription' }: PublicSubscriptionViewProps) {
  const loginHref = '/login';
  const description =
    source === 'login'
      ? 'Assine o plano e finalize o cadastro da clínica depois do pagamento.'
      : 'Escolha a forma de pagamento para continuar.';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
        <header className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
          <Image src="/logo.svg" alt="Dr. Agenda" width={150} height={36} priority className="h-auto w-[132px] sm:w-[150px]" />

          <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Link href={loginHref}>Área do cliente</Link>
          </Button>
        </header>

        <Card className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <CardHeader className="px-6 py-8 sm:px-8 sm:py-9">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Assinatura mensal
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">Plano Premium</h2>
                <p className="text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
              </div>
              <div className="pt-1">
                <div className="flex flex-wrap items-end justify-center gap-2 text-slate-950">
                  <span className="text-4xl font-bold tracking-[-0.05em] sm:text-6xl">R$ 99,90</span>
                  <span className="pb-1 text-sm text-slate-500 sm:text-base">/mês</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 px-6 py-8 sm:px-8">
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex min-h-[68px] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {methods.map((method) => {
                const Icon = method.icon;

                return (
                  <div
                    key={method.title}
                    className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-6"
                  >
                    <div className={`h-1 w-full rounded-full ${method.accent}`} />
                    <div className="mt-5 flex flex-1 flex-col">
                      <div className="flex min-h-[104px] items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${method.iconBg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{method.title}</h3>
                          <p className="text-sm leading-6 text-slate-600">{method.description}</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        Primeiro você paga. Depois, com o pagamento confirmado, finaliza o cadastro.
                      </div>

                      <div className="mt-6 flex flex-1 items-end">
                        <PublicCheckoutButton
                          paymentMethod={method.paymentMethod}
                          label={method.buttonLabel}
                          variant={method.buttonVariant}
                          className={method.paymentMethod === 'boleto'
                            ? 'h-12 w-full rounded-2xl border-slate-300 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50'
                            : 'h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold hover:bg-slate-800'}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto flex items-center gap-2 text-sm text-slate-500">
          <Stethoscope className="h-4 w-4" />
          Gestão profissional para clínicas e consultórios.
        </div>
      </div>
    </div>
  );
}
