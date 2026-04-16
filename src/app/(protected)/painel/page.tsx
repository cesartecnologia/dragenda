import dayjs from 'dayjs';
import { Calendar, CircleDollarSign, Clock3, Percent, Stethoscope } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from '@/components/ui/page-container';
import { getDashboard } from '@/data/get-dashboard';
import { formatCurrencyInCents } from '@/helpers/currency';
import { formatDateTimeBr } from '@/helpers/time';
import { canAccessDashboard } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import { DatePicker } from '../dashboard/_components/date-picker';
import AppointmentsChart from '../dashboard/_components/revenue-chart';
import StatsCards from '../dashboard/_components/stats-card';
import TopDoctors from '../dashboard/_components/top-doctors';
import TodayAppointmentsList from './_components/today-appointments-list';

interface DashboardPageProps {
  searchParams: Promise<{ from: string; to: string }>;
}

export default async function PainelPage({ searchParams }: DashboardPageProps) {
  const session = await requireSubscribedSession();
  if (!canAccessDashboard(session.user.role)) redirect('/agendamentos');
  const { from, to } = await searchParams;
  if (!from || !to) redirect(`/painel?from=${dayjs().startOf('month').format('YYYY-MM-DD')}&to=${dayjs().endOf('month').format('YYYY-MM-DD')}`);

  const [dashboard, clinic] = await Promise.all([
    getDashboard({ from, to, session: { user: { clinic: { id: session.user.clinic!.id } } } }),
    getClinicById(session.user.clinic!.id),
  ]);

  const insightItems = [
    {
      label: 'Em aberto',
      value: formatCurrencyInCents(dashboard.pendingRevenue?.total ? Number(dashboard.pendingRevenue.total) : 0),
      icon: CircleDollarSign,
    },
    {
      label: 'Concluídas',
      value: String(dashboard.completedAppointments?.total ?? 0),
      icon: Stethoscope,
    },
    {
      label: 'Taxa de recebimento',
      value: `${Math.round(dashboard.collectionRate ?? 0)}%`,
      icon: Percent,
    },
  ];

  return (
    <PageContainer className="pb-8">
      <PageHeader className="gap-4">
        <PageHeaderContent className="space-y-2">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Início / Painel
          </div>
          <PageTitle className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Visão geral da clínica</PageTitle>
          <PageDescription className="max-w-2xl text-sm leading-6 text-slate-500">
            Veja os números mais importantes do período e acompanhe a agenda da {clinic.name} com mais clareza.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker className="w-full sm:w-auto" />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-6">
        <StatsCards
          totalRevenue={dashboard.totalRevenue.total ? Number(dashboard.totalRevenue.total) : null}
          totalAppointments={dashboard.totalAppointments.total}
          totalPatients={dashboard.totalPatients.total}
          totalDoctors={dashboard.totalDoctors.total}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_340px]">
          <AppointmentsChart dailyAppointmentsData={dashboard.dailyAppointmentsData} />

          <div className="space-y-4">
            <Card className="rounded-[1.85rem] border border-slate-200/80 bg-white shadow-[0_20px_38px_-30px_rgba(15,23,42,0.24)]">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resumo rápido</p>
                    <CardTitle className="mt-2 text-lg font-semibold tracking-tight text-slate-950">Indicadores do período</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Acompanhe os pontos que merecem atenção imediata.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-500">
                    <Percent className="size-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {insightItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/75 px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600">{item.label}</p>
                          <p className="text-xs text-slate-400">Atualizado com base no período selecionado</p>
                        </div>
                      </div>
                      <span className="text-base font-semibold text-slate-950">{item.value}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <TopDoctors doctors={dashboard.topDoctors} />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <Card className="overflow-hidden rounded-[1.85rem] border border-slate-200/80 bg-white shadow-[0_20px_38px_-30px_rgba(15,23,42,0.24)]">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">Atendimentos de hoje</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Uma visão prática da agenda do dia.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <TodayAppointmentsList appointments={dashboard.todayAppointments} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.85rem] border border-slate-200/80 bg-white shadow-[0_20px_38px_-30px_rgba(15,23,42,0.24)]">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600">
                  <Clock3 className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-slate-950">Próximos atendimentos</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Os próximos horários confirmados na agenda.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {dashboard.upcomingAppointments.length ? dashboard.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-[1.4rem] border border-slate-100 bg-slate-50/75 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="truncate text-slate-950">{appointment.patient.name}</strong>
                    <span className="shrink-0 text-slate-500">{formatDateTimeBr(appointment.date)}</span>
                  </div>
                  <p className="mt-2 text-slate-500">{appointment.doctor.name} • {appointment.doctor.specialty}</p>
                </div>
              )) : <p className="text-sm text-slate-500">Sem atendimentos futuros cadastrados.</p>}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}
