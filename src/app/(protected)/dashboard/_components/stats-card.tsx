import {
  CalendarIcon,
  DollarSignIcon,
  Stethoscope,
  UserIcon,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrencyInCents } from '@/helpers/currency';

interface StatsCardsProps {
  totalRevenue: number | null;
  totalAppointments: number;
  totalPatients: number;
  totalDoctors: number;
}

const StatsCards = ({
  totalRevenue,
  totalAppointments,
  totalPatients,
  totalDoctors,
}: StatsCardsProps) => {
  const stats = [
    {
      title: 'Faturamento',
      value: totalRevenue ? formatCurrencyInCents(totalRevenue) : 'R$ 0,00',
      detail: 'Recebido no período selecionado',
      icon: DollarSignIcon,
      className: 'from-[#edf2ff] to-[#f8f9ff]',
      iconClassName: 'border-blue-100 bg-white text-blue-600',
    },
    {
      title: 'Agendamentos',
      value: totalAppointments.toString(),
      detail: 'Consultas registradas no período',
      icon: CalendarIcon,
      className: 'from-[#ebfaf6] to-[#f6fdfb]',
      iconClassName: 'border-emerald-100 bg-white text-emerald-600',
    },
    {
      title: 'Pacientes',
      value: totalPatients.toString(),
      detail: 'Base ativa da clínica',
      icon: UserIcon,
      className: 'from-[#eef6ff] to-[#f8fbff]',
      iconClassName: 'border-sky-100 bg-white text-sky-600',
    },
    {
      title: 'Médicos',
      value: totalDoctors.toString(),
      detail: 'Profissionais cadastrados',
      icon: Stethoscope,
      className: 'from-[#f5f3ff] to-[#fbfaff]',
      iconClassName: 'border-violet-100 bg-white text-violet-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={`overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br ${stat.className} shadow-[0_18px_34px_-28px_rgba(15,23,42,0.18)]`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <div className="mt-4 text-[2rem] font-semibold tracking-tight text-slate-950">{stat.value}</div>
                  <p className="mt-2 text-sm text-slate-500">{stat.detail}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${stat.iconClassName}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
