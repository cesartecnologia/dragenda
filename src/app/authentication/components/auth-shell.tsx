import Image from 'next/image';
import { CalendarClock, CheckCircle2, LayoutDashboard, ShieldCheck, Smartphone } from 'lucide-react';

const highlights = [
  {
    icon: CalendarClock,
    title: 'Agenda inteligente',
    description: 'Organize consultas, confirme horários e acompanhe a rotina da clínica com agilidade.',
  },
  {
    icon: LayoutDashboard,
    title: 'Gestão completa',
    description: 'Controle pacientes, equipe, atendimentos e informações importantes em um só lugar.',
  },
  {
    icon: Smartphone,
    title: 'Experiência mobile',
    description: 'Acesse e opere o sistema com mais conforto também no celular.',
  },
  {
    icon: ShieldCheck,
    title: 'Acesso seguro',
    description: 'Tenha um ambiente profissional, confiável e pronto para o dia a dia da clínica.',
  },
];

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white sm:p-8 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_28%)]" />
          <div className="relative space-y-6 sm:space-y-8">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-blue-100 sm:text-xs">
              {eyebrow}
            </div>

            <div className="space-y-5">
              <Image src="/logo.svg" alt="Dr. Agenda" width={172} height={36} priority className="h-auto w-[148px] brightness-0 invert sm:w-[172px]" />
              <div className="space-y-3">
                <h1 className="max-w-xl text-2xl font-semibold leading-tight sm:text-4xl">{title}</h1>
                <p className="max-w-xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">{description}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
              {highlights.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <div key={itemTitle} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white/10 p-2">
                      <Icon className="size-5 text-blue-100" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-sm font-semibold text-white">{itemTitle}</h2>
                      <p className="text-sm leading-6 text-slate-200">{itemDescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 rounded-2xl border border-white/10 bg-white/6 p-5 text-sm text-slate-200 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2 text-white">
              <CheckCircle2 className="size-4 text-emerald-300" />
              <span className="font-medium">Plano Premium</span>
            </div>
            <p className="leading-6">
              Assine para liberar agenda, pacientes, atendimentos, equipe e os principais recursos do Dr. Agenda em uma experiência profissional.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-50 p-3 sm:p-6 lg:p-10">
          <div className="w-full max-w-2xl">{children}</div>
        </section>
      </div>
    </div>
  );
}
