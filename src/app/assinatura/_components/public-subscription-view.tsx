import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const features = [
  'Cadastro ilimitado de médicos',
  'Agendamentos ilimitados',
  'Visão completa da rotina da clínica',
  'Cadastro completo de pacientes',
  'Gestão da equipe e atendimentos',
  'Suporte prioritário',
];

type PublicSubscriptionViewProps = {
  source?: 'login' | 'subscription';
};

export function PublicSubscriptionView({ source = 'subscription' }: PublicSubscriptionViewProps) {
  const loginHref = '/autenticacao/login';
  const heading = 'Assinatura Premium';
  const description =
    source === 'login'
      ? 'Centralize agenda, pacientes, equipe e operação da clínica em uma única plataforma.'
      : 'Tenha controle da operação da clínica em um único lugar.';

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Dr. Agenda" width={150} height={36} priority className="h-auto w-[132px] sm:w-[150px]" />
          </div>

          <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Link href={loginHref}>Área do cliente</Link>
          </Button>
        </header>

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">{heading}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{description}</p>
        </div>

        <Card className="mx-auto w-full max-w-4xl rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
          <CardHeader className="space-y-5 p-6 sm:p-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Plano principal da clínica
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950">Plano Premium</h2>
              <p className="text-base leading-7 text-slate-600">
                Tudo o que sua clínica precisa para organizar atendimentos, pacientes e equipe.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-6 sm:px-6">
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">R$ 99,90</span>
                <span className="pb-1 text-base text-slate-500">/mês</span>
              </div>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Ideal para clínicas que querem concentrar agenda, pacientes, equipe e visão do negócio em uma única plataforma.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 pt-0 sm:p-8 sm:pt-0">
            <div className="border-t border-slate-200 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <p className="text-[17px] leading-7 text-slate-700">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 flex-1 rounded-xl bg-blue-600 text-base hover:bg-blue-700">
                <Link href="/primeiro-acesso?intent=checkout">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Assinar plano Premium
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 flex-1 rounded-xl border-slate-300 text-base text-slate-700 hover:bg-slate-50">
                <Link href={loginHref}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Entrar na área do cliente
                </Link>
              </Button>
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
