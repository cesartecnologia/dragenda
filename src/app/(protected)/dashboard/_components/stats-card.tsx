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
  todayAppointmentsCount?: number;
  completedAppointments?: number;
  pendingRevenue?: number | null;
  collectionRate?: number | null;
}

const primaryCardTone = [
  'from-[#eef4ff] via-[#f7faff] to-white text-[#4a6fa8]',
  'from-[#edf5ff] via-[#f8fbff] to-white text-[#5678b5]',
  'from-[#f2f6ff] via-[#fbfcff] to-white text-[#6478b8]',
  'from-[#eef7ff] via-[#f8fbff] to-white text-[#5d83be]',
] as const;

const compactTone = [
  'bg-[#eef4ff] text-[#5f76ab]',
  'bg-[#f3f7ff] text-[#7486ba]',
  'bg-[#eef4ff] text-[#5f76ab]',
  'bg-[#f3f7ff] text-[#7486ba]',
] as const;

const StatsCards = ({
  totalRevenue,
  totalAppointments,
  totalPatients,
  totalDoctors,
  todayAppointmentsCount = 0,
  completedAppointments = 0,
  pendingRevenue,
  collectionRate,
}: StatsCardsProps) => {
  const primaryStats = [
    {
      title: 'Faturamento',
      value: totalRevenue ? formatCurrencyInCents(totalRevenue) : 'R$ 0,00',
      note: 'no período selecionado',
      icon: DollarSignIcon,
    },
    {
      title: 'Agendamentos',
      value: totalAppointments.toString(),
      note: 'no mês atual',
      icon: CalendarIcon,
    },
    {
      title: 'Pacientes',
      value: totalPatients.toString(),
      note: 'com cadastro ativo',
      icon: UserIcon,
    },
    {
      title: 'Hoje',
      value: todayAppointmentsCount.toString(),
      note: 'atendimentos do dia',
      icon: CalendarIcon,
    },
  ];

  const compactStats = [
    {
      title: 'Médicos',
      value: totalDoctors.toString(),
      icon: UsersIcon,
    },
    {
      title: 'A receber',
      value: pendingRevenue ? formatCurrencyInCents(pendingRevenue) : 'R$ 0,00',
      icon: ReceiptIcon,
    },
    {
      title: 'Concluídos',
      value: completedAppointments.toString(),
      icon: Stethoscope,
    },
    {
      title: 'Recebido',
      value: `${Math.round(collectionRate ?? 0)}%`,
      icon: PercentIcon,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={cn(
                'animate-panel-fade-up relative overflow-hidden border-white/80 bg-gradient-to-br shadow-[0_14px_30px_rgba(125,160,220,0.12)]',
                primaryCardTone[index],
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="pointer-events-none absolute right-[-18px] top-[-24px] h-28 w-28 rounded-full bg-white/40 blur-2xl" />
              <CardContent className="relative px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="text-sm font-medium text-slate-600">{stat.title}</div>
                    <div className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">{stat.value}</div>
                    <div className="text-sm text-slate-500">{stat.note}</div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-[0_8px_18px_rgba(125,160,220,0.10)]">
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
            <Card key={stat.title} className="animate-panel-fade-up bg-white/92" style={{ animationDelay: `${(index + 3) * 70}ms` }}>
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
