import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarRange,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const features = [
  'Agenda médica organizada em um só lugar',
  'Cadastro completo de pacientes e equipe',
  'Rotina da clínica mais leve e profissional',
  'Acesso seguro para cada perfil da clínica',
];

type PublicSubscriptionViewProps = {
  source?: 'login' | 'subscription';
};

export function PublicSubscriptionView({ source = 'subscription' }: PublicSubscriptionViewProps) {
  const loginHref = '/autenticacao/login';
  const title =
    source === 'login'
      ? 'Organize sua clínica com uma assinatura simples, profissional e pronta para começar.'
      : 'Conheça sua assinatura antes de cadastrar a clínica.';
  const description =
    source === 'login'
      ? 'Veja o que está incluso no Dr. Agenda, conheça o valor da assinatura e siga para o cadastro da clínica quando decidir continuar.'
      : 'Veja o que está incluso no Dr. Agenda e, quando decidir continuar, faça o cadastro da clínica para seguir direto para a contratação.';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_45%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white/95 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Dr. Agenda" width={150} height={36} priority className="h-auto w-[138px] sm:w-[150px]" />
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="hidden text-sm text-slate-500 sm:block">Sistema para clínicas e consultórios</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
              Área do cliente
            </div>
            <Button asChild variant="outline" className="rounded-full border-sky-200 text-sky-700 hover:bg-sky-50">
              <Link href={loginHref}>Login</Link>
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-1.5 text-xs font-medium text-sky-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Plano Premium Dr. Agenda
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
        </div>

        <Card className="mx-auto w-full max-w-4xl overflow-hidden border-sky-100 bg-white shadow-[0_24px_80px_rgba(14,165,233,0.10)]">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#38bdf8_0%,#60a5fa_50%,#93c5fd_100%)]" />
          <CardHeader className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  <CreditCard className="h-3.5 w-3.5" />
                  Assinatura Premium
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Plano completo para a rotina da clínica</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Uma assinatura mensal para organizar agenda, equipe, pacientes e atendimento em uma experiência profissional.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left lg:min-w-[240px]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-slate-950">R$ 99,90</span>
                  <span className="text-sm text-slate-500">/mês</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Cadastro da clínica, contratação e acesso liberado no mesmo fluxo.
                </p>
              </div>
            </div>

            <div className="grid auto-rows-fr gap-3 md:grid-cols-3">
              <div className="h-full rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <CalendarRange className="mb-3 h-5 w-5 text-sky-700" />
                <div className="text-sm font-semibold text-slate-900">Agenda organizada</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">Horários, encaixes e rotina mais fluida.</div>
              </div>
              <div className="h-full rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <UsersRound className="mb-3 h-5 w-5 text-sky-700" />
                <div className="text-sm font-semibold text-slate-900">Equipe conectada</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">Acesso por perfil para o time da clínica.</div>
              </div>
              <div className="h-full rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-sky-700" />
                <div className="text-sm font-semibold text-slate-900">Gestão com segurança</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">Mais controle sobre a operação da clínica.</div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid auto-rows-fr gap-3 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex h-full items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1 rounded-xl">
                <Link href="/primeiro-acesso?intent=checkout">Assinar agora</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1 rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50">
                <Link href={loginHref}>Entrar na área do cliente</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
