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
    description: 'Permissões definidas para cada função da clínica.',
  },
] as const;

type AuthShellProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  headerLinkHref?: string;
  headerLinkLabel?: string;
  mode?: 'split' | 'single';
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  headerLinkHref = '/autenticacao',
  headerLinkLabel = 'Ver plano',
  mode = 'split',
}: AuthShellProps) {
  const isSingle = mode === 'single';

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-3 py-4 sm:px-5 sm:py-6">
      <div className={`mx-auto flex w-full flex-col gap-6 ${isSingle ? 'max-w-4xl' : 'max-w-[1180px]'}`}>
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <Image src="/logo.svg" alt="Dr. Agenda" width={150} height={36} priority className="h-auto w-[132px] sm:w-[150px]" />
          <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            <Link href={headerLinkHref}>
              <LogIn className="mr-2 h-4 w-4" />
              {headerLinkLabel}
            </Link>
          </Button>
        </header>

        {isSingle ? (
          <section className="flex w-full items-stretch">
            <div className="w-full">{children}</div>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
            <section className="flex h-full min-h-[540px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-6">
              {eyebrow ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {eyebrow}
                </div>
              ) : null}

              {(title || description) ? (
                <div className="mt-4 space-y-2 text-center">
                  {title ? (
                    <h1 className="mx-auto max-w-xl text-[2rem] font-bold tracking-[-0.03em] text-slate-950 sm:text-[2.15rem]">
                      {title}
                    </h1>
                  ) : null}
                  {description ? (
                    <p className="mx-auto max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">{description}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 grid flex-1 content-center gap-3">
                {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                  <div key={itemTitle} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-[15px] font-semibold text-slate-900">{itemTitle}</h2>
                        <p className="text-sm leading-5 text-slate-600">{itemDescription}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex h-full items-stretch">
              <div className="flex h-full w-full">{children}</div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
