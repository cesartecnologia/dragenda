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
  'from-slate-50 via-white to-white text-slate-700',
  'from-slate-50 via-white to-white text-slate-700',
  'from-slate-100 via-white to-white text-slate-700',
  'from-slate-50 via-white to-white text-slate-700',
] as const;

const compactTone = [
  'bg-slate-100 text-slate-700',
  'bg-slate-100 text-slate-700',
  'bg-slate-100 text-slate-700',
  'bg-slate-100 text-slate-700',
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
      title: 'Concluídos',
      value: completedAppointments.toString(),
      note: 'atendimentos finalizados',
      icon: Stethoscope,
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
      title: 'A receber',
      value: pendingRevenue ? formatCurrencyInCents(pendingRevenue) : 'R$ 0,00',
      icon: ReceiptIcon,
    },
    {
      title: 'Recebido',
      value: `${Math.round(collectionRate ?? 0)}%`,
      icon: PercentIcon,
    },
    {
      title: 'Médicos',
      value: totalDoctors.toString(),
      icon: UsersIcon,
    },
    {
      title: 'Pacientes',
      value: totalPatients.toString(),
      icon: UserIcon,
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
                'relative overflow-hidden border-white/80 bg-gradient-to-br shadow-[0_14px_30px_rgba(125,160,220,0.12)]',
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
            <Card key={stat.title} className="bg-white/92">
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
