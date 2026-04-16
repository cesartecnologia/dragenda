import {
  CalendarIcon,
  DollarSignIcon,
  PercentIcon,
  ReceiptIcon,
  Stethoscope,
  UserIcon,
  UsersIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyInCents } from '@/helpers/currency';

interface StatsCardsProps {
  totalRevenue: number | null;
  totalAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  completedAppointments?: number;
  pendingRevenue?: number | null;
  collectionRate?: number | null;
}

const StatsCards = ({
  totalRevenue,
  totalAppointments,
  totalPatients,
  totalDoctors,
  completedAppointments = 0,
  pendingRevenue,
  collectionRate,
}: StatsCardsProps) => {
  const stats = [
    {
      title: 'Faturamento',
      value: totalRevenue ? formatCurrencyInCents(totalRevenue) : 'R$ 0,00',
      detail: 'Recebido no período',
      icon: DollarSignIcon,
    },
    {
      title: 'Agendamentos',
      value: totalAppointments.toString(),
      detail: 'Total do período',
      icon: CalendarIcon,
    },
    {
      title: 'Pacientes',
      value: totalPatients.toString(),
      detail: 'Base ativa da clínica',
      icon: UserIcon,
    },
    {
      title: 'Médicos',
      value: totalDoctors.toString(),
      detail: 'Profissionais cadastrados',
      icon: UsersIcon,
    },
    {
      title: 'Em aberto',
      value: pendingRevenue ? formatCurrencyInCents(pendingRevenue) : 'R$ 0,00',
      detail: 'Ainda não recebido',
      icon: ReceiptIcon,
    },
    {
      title: 'Consultas concluídas',
      value: completedAppointments.toString(),
      detail: 'Finalizadas no período',
      icon: Stethoscope,
    },
    {
      title: 'Taxa de recebimento',
      value: `${Math.round(collectionRate ?? 0)}%`,
      detail: 'Pagamentos confirmados',
      icon: PercentIcon,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                <p className="mt-1 text-xs text-slate-400">{stat.detail}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
