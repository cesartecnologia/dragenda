import {
  CalendarIcon,
  DollarSignIcon,
  PercentIcon,
  ReceiptIcon,
  Stethoscope,
  UserIcon,
  UsersIcon,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyInCents } from '@/helpers/currency';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  totalRevenue: number | null;
  totalAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  completedAppointments?: number;
  pendingRevenue?: number | null;
  collectionRate?: number | null;
}

const primaryCardTone = [
  'from-[#edf4ff] via-[#f8fbff] to-white text-[#295a96]',
  'from-[#edf9f7] via-[#f8fcfb] to-white text-[#0d7769]',
  'from-[#f2f6ff] via-[#fafcff] to-white text-[#4863a8]',
] as const;

const compactTone = [
  'bg-[#f8fbfb] text-[#0d7769]',
  'bg-[#f7f8fd] text-[#4863a8]',
  'bg-[#f8fbfb] text-[#0d7769]',
  'bg-[#f7f8fd] text-[#4863a8]',
] as const;

const StatsCards = ({
  totalRevenue,
  totalAppointments,
  totalPatients,
  totalDoctors,
  completedAppointments = 0,
  pendingRevenue,
  collectionRate,
}: StatsCardsProps) => {
  const primaryStats = [
    {
      title: 'Faturamento do período',
      value: totalRevenue ? formatCurrencyInCents(totalRevenue) : 'R$ 0,00',
      note: 'Receita confirmada no intervalo selecionado',
      icon: DollarSignIcon,
    },
    {
      title: 'Agendamentos',
      value: totalAppointments.toString(),
      note: 'Consultas registradas no período',
      icon: CalendarIcon,
    },
    {
      title: 'Pacientes ativos',
      value: totalPatients.toString(),
      note: 'Base de pacientes com cadastro ativo',
      icon: UserIcon,
    },
  ];

  const compactStats = [
    {
      title: 'Médicos',
      value: totalDoctors.toString(),
      icon: UsersIcon,
    },
    {
      title: 'Em aberto',
      value: pendingRevenue ? formatCurrencyInCents(pendingRevenue) : 'R$ 0,00',
      icon: ReceiptIcon,
    },
    {
      title: 'Consultas concluídas',
      value: completedAppointments.toString(),
      icon: Stethoscope,
    },
    {
      title: 'Taxa de recebimento',
      value: `${Math.round(collectionRate ?? 0)}%`,
      icon: PercentIcon,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3">
        {primaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={cn(
                'animate-panel-fade-up relative overflow-hidden border-white/70 bg-gradient-to-br shadow-[0_18px_38px_rgba(15,23,42,0.08)]',
                primaryCardTone[index],
              )}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="pointer-events-none absolute right-[-24px] top-[-34px] h-32 w-32 rounded-full bg-white/35 blur-2xl" />
              <CardContent className="relative px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-600">{stat.title}</div>
                    <div className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">{stat.value}</div>
                    <div className="text-sm text-slate-500">{stat.note}</div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/85 shadow-[0_8px_16px_rgba(15,23,42,0.06)]">
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {compactStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="animate-panel-fade-up bg-white/92" style={{ animationDelay: `${(index + 3) * 75}ms` }}>
              <CardContent className="flex items-center justify-between gap-4 px-5 py-5">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{stat.value}</p>
                </div>
                <div className={cn('flex size-11 items-center justify-center rounded-2xl', compactTone[index])}>
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StatsCards;
