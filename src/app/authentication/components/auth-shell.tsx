import Image from 'next/image';
import { Activity, CalendarClock, HeartPulse, ShieldCheck, Smartphone } from 'lucide-react';

const highlights = [
  {
    icon: CalendarClock,
    title: 'Agenda organizada',
    description: 'Centralize agendamentos, confirmações e a rotina da clínica com mais agilidade.',
  },
  {
    icon: HeartPulse,
    title: 'Pacientes e atendimentos',
    description: 'Tenha histórico, dados e acompanhamento em um ambiente mais profissional.',
  },
  {
    icon: Smartphone,
    title: 'Uso confortável no celular',
    description: 'Acesse o sistema com fluidez também no mobile, sem telas quebradas.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança no acesso',
    description: 'Controle a equipe e mantenha a operação da clínica protegida.',
  },
] as const;

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_45%,#ffffff_100%)] px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_28px_100px_rgba(59,130,246,0.12)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative flex flex-col justify-between overflow-hidden border-b border-sky-100 bg-white p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="absolute right-[-60px] top-[-60px] h-44 w-44 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-40px] h-52 w-52 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="relative space-y-6 sm:space-y-8">
            <div className="inline-flex w-fit items-center rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-sky-700 sm:text-xs">
              {eyebrow}
            </div>

            <div className="space-y-5">
              <Image src="/logo.svg" alt="Dr. Agenda" width={164} height={36} priority className="h-auto w-[150px] sm:w-[164px]" />
              <div className="space-y-3">
                <h1 className="max-w-xl text-2xl font-semibold leading-tight text-slate-900 sm:text-4xl">{title}</h1>
                <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{description}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
              {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <div key={itemTitle} className="rounded-2xl border border-sky-100 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-sky-50 p-2 text-sky-700">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-slate-900">{itemTitle}</h2>
                      <p className="text-sm leading-6 text-slate-600">{itemDescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 rounded-2xl border border-sky-100 bg-sky-50/80 p-5 text-sm text-slate-600">
            <div className="mb-3 flex items-center gap-2 text-slate-900">
              <Activity className="size-4 text-sky-600" />
              <span className="font-medium">Dr. Agenda Premium</span>
            </div>
            <p className="leading-6">
              Agenda, pacientes, equipe e gestão da clínica em uma experiência mais rápida, leve e profissional para o dia a dia.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 sm:p-6 lg:p-10">
          <div className="w-full max-w-2xl">{children}</div>
        </section>
      </div>
    </div>
  );
}
