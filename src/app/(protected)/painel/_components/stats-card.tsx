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
  'from-[#2b3445] via-[#2f3a4d] to-[#35445d] text-[#e3ad67]',
  'from-[#2c3648] via-[#303c50] to-[#38475f] text-[#b8c7de]',
  'from-[#2b3841] via-[#32444f] to-[#395765] text-[#8fd7af]',
  'from-[#3a2e3f] via-[#463552] to-[#594062] text-[#e6b5d2]',
] as const;

const compactTone = [
  'bg-[#2f3a4d] text-[#d2a061]',
  'bg-[#34495a] text-[#9fd7b1]',
  'bg-[#44324b] text-[#ddb7d3]',
  'bg-[#2e3f52] text-[#a9bfdc]',
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
                'relative overflow-hidden border-[#3b4660] bg-gradient-to-br shadow-[0_16px_28px_rgba(8,12,20,0.3)]',
                primaryCardTone[index],
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="pointer-events-none absolute right-[-18px] top-[-24px] h-28 w-28 rounded-full bg-white/15 blur-2xl" />
              <CardContent className="relative px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="text-sm font-medium text-[#c1ccdf]">{stat.title}</div>
                    <div className="text-[2rem] font-semibold tracking-[-0.04em] text-[#f4f8ff]">{stat.value}</div>
                    <div className="text-sm text-[#aab7cd]">{stat.note}</div>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#212a38]/70 shadow-[0_8px_18px_rgba(0,0,0,0.22)]">
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
            <Card key={stat.title} className="border-[#d5c4a5] bg-[linear-gradient(180deg,#f9ecd2_0%,#f3e0bc_100%)]">
              <CardContent className="flex items-center justify-between gap-4 px-5 py-5">
                <div>
                  <p className="text-sm text-[#6e5940]">{stat.title}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#2f261c]">{stat.value}</p>
                </div>
                <div className={cn('flex size-11 items-center justify-center rounded-xl', compactTone[index])}>
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

