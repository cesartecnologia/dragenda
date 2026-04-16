import { Suspense } from 'react';

import dayjs from 'dayjs';
import { Calendar, Clock3 } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { getDashboard } from '@/data/get-dashboard';
import { formatDateTimeBr } from '@/helpers/time';
import { canAccessDashboard } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';

import { DatePicker } from '../dashboard/_components/date-picker';
import AppointmentsChart from '../dashboard/_components/revenue-chart';
import StatsCards from '../dashboard/_components/stats-card';
import TopDoctors from '../dashboard/_components/top-doctors';
import TodayAppointmentsList from './_components/today-appointments-list';

interface DashboardPageProps {
  searchParams: Promise<{ from: string; to: string }>;
}

async function PainelDataSection({ clinicId, from, to }: { clinicId: string; from: string; to: string }) {
  const dashboard = await getDashboard({
    from,
    to,
    session: { user: { clinic: { id: clinicId } } },
  });

  return (
    <>
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
            <TodayAppointmentsList appointments={dashboard.todayAppointments} />
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
    </>
  );
}

function PainelSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.25fr_1fr]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.25fr_1fr]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default async function PainelPage({ searchParams }: DashboardPageProps) {
  const session = await requireSubscribedSession();
  if (!canAccessDashboard(session.user.role)) redirect('/agendamentos');

  const { from, to } = await searchParams;
  if (!from || !to) {
    redirect(`/painel?from=${dayjs().startOf('month').format('YYYY-MM-DD')}&to=${dayjs().endOf('month').format('YYYY-MM-DD')}`);
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Painel</PageTitle>
        </PageHeaderContent>
        <PageActions>
          <DatePicker />
        </PageActions>
      </PageHeader>

      <PageContent>
        <Suspense fallback={<PainelSkeleton />}>
          <PainelDataSection clinicId={session.user.clinic!.id} from={from} to={to} />
        </Suspense>
      </PageContent>
    </PageContainer>
  );
}
