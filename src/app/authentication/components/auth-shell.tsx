import Image from 'next/image';
import {
  Activity,
  CalendarRange,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from 'lucide-react';

const highlights = [
  {
    icon: CalendarRange,
    title: 'Agenda no controle',
    description: 'Organize confirmações, horários e encaixes com muito mais rapidez.',
  },
  {
    icon: UsersRound,
    title: 'Equipe conectada',
    description: 'Centralize o trabalho da clínica em uma rotina simples e profissional.',
  },
  {
    icon: HeartPulse,
    title: 'Pacientes bem acompanhados',
    description: 'Acesse dados importantes do atendimento sem perder tempo.',
  },
  {
    icon: ShieldCheck,
    title: 'Acesso seguro',
    description: 'Mantenha perfis e permissões da clínica protegidos todos os dias.',
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
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#edf6ff_42%,#ffffff_100%)] px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[30px] border border-sky-100/80 bg-white shadow-[0_24px_90px_rgba(56,189,248,0.14)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.03fr_0.97fr]">
        <section className="relative flex flex-col justify-between overflow-hidden border-b border-sky-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_34%)]" />
          <div className="absolute right-[-40px] top-[-50px] h-36 w-36 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute bottom-[-70px] left-[-30px] h-44 w-44 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="relative space-y-7 sm:space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex w-fit items-center rounded-full border border-sky-100 bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 sm:text-xs">
                {eyebrow}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-sky-600" />
                Plataforma profissional para clínicas
              </div>
            </div>

            <div className="space-y-5">
              <Image
                src="/logo.svg"
                alt="Dr. Agenda"
                width={170}
                height={40}
                priority
                className="h-auto w-[152px] sm:w-[170px]"
              />

              <div className="space-y-3.5">
                <h1 className="max-w-2xl text-[1.8rem] font-semibold leading-[1.15] tracking-[-0.02em] text-slate-950 sm:text-[2.2rem] lg:text-[2.55rem]">
                  {title}
                </h1>
                <p className="max-w-xl text-[15px] leading-7 text-slate-600 sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Mais fluidez</div>
                    <div className="text-xs leading-5 text-slate-500">Rotina mais ágil</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <UsersRound className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Equipe conectada</div>
                    <div className="text-xs leading-5 text-slate-500">Acesso por perfil</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:col-span-3 lg:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Mobile pronto</div>
                    <div className="text-xs leading-5 text-slate-500">Uso confortável no celular</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
              {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <div
                  key={itemTitle}
                  className="rounded-2xl border border-sky-100 bg-white/92 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 rounded-2xl bg-sky-50 p-3 text-sky-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="text-[15px] font-semibold leading-5 text-slate-900">{itemTitle}</h2>
                      <p className="text-sm leading-6 text-slate-600">{itemDescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 rounded-[24px] border border-sky-100 bg-[linear-gradient(180deg,rgba(240,249,255,0.9)_0%,rgba(255,255,255,0.95)_100%)] p-5 text-sm text-slate-600 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-slate-950">
              <Activity className="h-4 w-4 text-sky-600" />
              <span className="font-semibold">Dr. Agenda Premium</span>
            </div>
            <p className="leading-6">
              Tenha agenda, pacientes, equipe e gestão da clínica em uma experiência leve, moderna e pronta para o dia a dia.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,#ffffff_0%,#f9fcff_100%)] p-3 sm:p-6 lg:p-10">
          <div className="w-full max-w-2xl">{children}</div>
        </section>
      </div>
    </div>
  );
}
