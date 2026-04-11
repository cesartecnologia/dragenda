import dayjs from 'dayjs';
import { Calendar, Clock3 } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { getDashboard } from '@/data/get-dashboard';
import { formatDateTimeBr } from '@/helpers/time';
import { canAccessDashboard } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';
import { getClinicById } from '@/server/clinic-data';

import AppointmentsDataTable from '../appointments/_components/appointments-data-table';
import { DatePicker } from '../dashboard/_components/date-picker';
import AppointmentsChart from '../dashboard/_components/revenue-chart';
import StatsCards from '../dashboard/_components/stats-card';
import TopDoctors from '../dashboard/_components/top-doctors';

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
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Painel</PageTitle>
        </PageHeaderContent>
        <PageActions><DatePicker /></PageActions>
      </PageHeader>
      <PageContent>
        <StatsCards
          totalRevenue={dashboard.totalRevenue.total ? Number(dashboard.totalRevenue.total) : null}
          totalAppointments={dashboard.totalAppointments.total}
          totalPatients={dashboard.totalPatients.total}
          totalDoctors={dashboard.totalDoctors.total}
          pendingRevenue={dashboard.pendingRevenue?.total ? Number(dashboard.pendingRevenue.total) : 0}
          completedAppointments={dashboard.completedAppointments?.total ?? 0}
          collectionRate={dashboard.collectionRate ?? 0}
        />
        <div className="grid gap-4 xl:grid-cols-[2.25fr_1fr]">
          <AppointmentsChart dailyAppointmentsData={dashboard.dailyAppointmentsData} />
          <TopDoctors doctors={dashboard.topDoctors} />
        </div>
        <div className="grid gap-4 xl:grid-cols-[2.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground" />
                <CardTitle className="text-base">Agendamentos de hoje</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AppointmentsDataTable data={dashboard.todayAppointments} patients={[]} doctors={[]} role={session.user.role} clinic={clinic} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock3 className="text-muted-foreground" />
                <CardTitle className="text-base">Próximos atendimentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.upcomingAppointments.length ? dashboard.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{appointment.patient.name}</strong>
                    <span className="text-muted-foreground">{formatDateTimeBr(appointment.date)}</span>
                  </div>
                  <p className="text-muted-foreground">{appointment.doctor.name} • {appointment.doctor.specialty}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">Sem atendimentos futuros cadastrados.</p>}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}
