import dayjs from 'dayjs';
import { Calendar, Clock3 } from 'lucide-react';
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

  return (
    <PageContainer className="pb-8">
      <PageHeader>
        <PageHeaderContent>
          <PageTitle className="text-slate-900">Painel</PageTitle>
          <PageDescription className="text-slate-500">
            Acompanhe os números principais e os próximos atendimentos da clínica.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-6">
        <StatsCards
          totalRevenue={dashboard.totalRevenue.total ? Number(dashboard.totalRevenue.total) : null}
          totalAppointments={dashboard.totalAppointments.total}
          totalPatients={dashboard.totalPatients.total}
          totalDoctors={dashboard.totalDoctors.total}
          pendingRevenue={dashboard.pendingRevenue?.total ? Number(dashboard.pendingRevenue.total) : 0}
          completedAppointments={dashboard.completedAppointments?.total ?? 0}
          collectionRate={dashboard.collectionRate ?? 0}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <AppointmentsChart dailyAppointmentsData={dashboard.dailyAppointmentsData} />
          <TopDoctors doctors={dashboard.topDoctors} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900">Atendimentos de hoje</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Uma visão rápida da agenda do dia.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <TodayAppointmentsList appointments={dashboard.todayAppointments} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                  <Clock3 className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900">Próximos atendimentos</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Os próximos horários confirmados na agenda.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {dashboard.upcomingAppointments.length ? dashboard.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-slate-900">{appointment.patient.name}</strong>
                    <span className="text-slate-500">{formatDateTimeBr(appointment.date)}</span>
                  </div>
                  <p className="mt-1 text-slate-500">{appointment.doctor.name} • {appointment.doctor.specialty}</p>
                </div>
              )) : <p className="text-sm text-slate-500">Sem atendimentos futuros cadastrados.</p>}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}
