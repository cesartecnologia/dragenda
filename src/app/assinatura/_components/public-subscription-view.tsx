import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CreditCard, FileText, ShieldCheck, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const features = [
  'Agenda, pacientes e equipe em um só lugar',
  'Atendimentos e cadastros ilimitados',
  'Organização da rotina da clínica com visão completa',
  'Suporte prioritário para operação do dia a dia',
];

type PublicSubscriptionViewProps = {
  source?: 'login' | 'subscription';
};

const methods = [
  {
    title: 'Cartão de crédito',
    description: 'Pagamento imediato no checkout do Asaas. Assim que confirmado, o cadastro da clínica é liberado.',
    href: '/assinatura/cartao',
    buttonLabel: 'Pagar com cartão',
    icon: CreditCard,
    buttonVariant: 'default' as const,
    accent: 'from-blue-600 to-cyan-500',
    iconBg: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Boleto bancário',
    description: 'Gere o boleto no Asaas e conclua o pagamento. O cadastro da clínica só libera após a confirmação.',
    href: '/assinatura/boleto',
    buttonLabel: 'Gerar boleto',
    icon: FileText,
    buttonVariant: 'outline' as const,
    accent: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-100 text-amber-700',
  },
] as const;

export function PublicSubscriptionView({ source = 'subscription' }: PublicSubscriptionViewProps) {
  const loginHref = '/login';
  const description =
    source === 'login'
      ? 'Centralize agenda, pacientes, equipe e operação da clínica em uma única plataforma.'
      : 'Escolha como deseja pagar. O acesso só é liberado depois que o pagamento for confirmado.';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff,transparent_38%),#f8fafc] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-6">
        <header className="flex items-center justify-between rounded-3xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
          <Image
            src="/logo.svg"
            alt="Dr. Agenda"
            width={150}
            height={36}
            priority
            className="h-auto w-[132px] sm:w-[150px]"
          />

          <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Link href={loginHref}>Área do cliente</Link>
          </Button>
        </header>

        <Card className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white sm:px-8 sm:py-10">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Pagamento seguro com Asaas
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-[-0.04em] sm:text-5xl">Plano Premium</h2>
                <p className="text-sm leading-7 text-slate-200 sm:text-base">{description}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-5">
                <div className="flex items-end justify-center gap-2">
                  <span className="text-4xl font-bold tracking-[-0.05em] sm:text-6xl">R$ 99,90</span>
                  <span className="pb-1 text-sm text-slate-300 sm:text-base">/mês</span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Ideal para clínicas que querem profissionalizar operação, agenda, pacientes e equipe sem complicação.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 px-6 py-8 sm:px-8">
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 sm:p-6">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-700 sm:text-base">{feature}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {methods.map((method) => {
                const Icon = method.icon;

                return (
                  <div
                    key={method.title}
                    className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:p-6"
                  >
                    <div className={`h-1 w-full rounded-full bg-gradient-to-r ${method.accent}`} />
                    <div className="mt-5 flex flex-1 flex-col">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${method.iconBg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{method.title}</h3>
                          <p className="text-sm leading-6 text-slate-600 sm:text-base">{method.description}</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        Pagamento primeiro, cadastro da clínica depois. Sem liberação antecipada de acesso.
                      </div>

                      <div className="mt-6 flex flex-1 items-end">
                        <Button
                          asChild
                          size="lg"
                          variant={method.buttonVariant}
                          className={`h-12 w-full rounded-2xl text-sm font-semibold sm:text-base ${method.buttonVariant === 'default' ? 'bg-slate-950 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'}`}
                        >
                          <Link href={method.href}>
                            <Icon className="mr-2 h-4 w-4" />
                            {method.buttonLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
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
