import Image from 'next/image';
import Link from 'next/link';
import { CalendarRange, LogIn, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

import { Button } from '@/components/ui/button';

const highlights = [
  {
    icon: CalendarRange,
    title: 'Agenda mais organizada',
    description: 'Controle horários, encaixes e atendimentos com mais clareza.',
  },
  {
    icon: UsersRound,
    title: 'Equipe integrada',
    description: 'Profissionais conectados em uma rotina simples e profissional.',
  },
  {
    icon: ShieldCheck,
    title: 'Acesso seguro',
    description: 'Cada usuário entra com o perfil certo para sua função.',
  },
] as const;

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  headerLinkHref?: string;
  headerLinkLabel?: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  headerLinkHref = '/autenticacao',
  headerLinkLabel = 'Ver plano',
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <Image src="/logo.svg" alt="Dr. Agenda" width={150} height={36} priority className="h-auto w-[132px] sm:w-[150px]" />
          <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Link href={headerLinkHref}>
              <LogIn className="mr-2 h-4 w-4" />
              {headerLinkLabel}
            </Link>
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-8">
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <h1 className="max-w-xl text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600">{description}</p>
            </div>

            <div className="mt-8 grid gap-4">
              {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <div key={itemTitle} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-slate-900">{itemTitle}</h2>
                      <p className="text-sm leading-6 text-slate-600">{itemDescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex items-start justify-center">
            <div className="w-full max-w-2xl">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
