import { Suspense } from 'react';

import dayjs from 'dayjs';
import { Calendar, ChevronRight, Clock3, LineChart } from 'lucide-react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActions, PageContainer, PageContent, PageDescription, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { getDashboard } from '@/data/get-dashboard';
import { formatDateTimeBr } from '@/helpers/time';
import { canAccessDashboard } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';

import { DatePicker } from '../dashboard/_components/date-picker';
import StatsCards from '../dashboard/_components/stats-card';
import TopDoctors from '../dashboard/_components/top-doctors';
import TodayAppointmentsList from './_components/today-appointments-list';

interface DashboardPageProps {
  searchParams: Promise<{ from: string; to: string }>;
}

const AppointmentsChart = dynamic(() => import('../dashboard/_components/revenue-chart'), {
  loading: () => <ChartCardSkeleton />,
});

function ChartCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-[24px]" />
      </CardContent>
    </Card>
  );
}

function EmptyChartCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eef5f5] text-primary">
            <LineChart className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl text-slate-900">Visão do período</CardTitle>
            <CardDescription>Aqui você acompanha a evolução diária da clínica.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-[320px] items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="font-medium text-slate-800">Ainda não há movimentação neste período.</p>
          <p className="text-sm text-slate-500">Assim que os agendamentos forem criados, o painel mostrará a evolução do mês.</p>
        </div>
      </CardContent>
    </Card>
  );
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_360px]">
        {dashboard.totalAppointments.total > 0 ? (
          <AppointmentsChart dailyAppointmentsData={dashboard.dailyAppointmentsData} />
        ) : (
          <EmptyChartCard />
        )}
        <TopDoctors doctors={dashboard.topDoctors} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_360px]">
        <Card className="animate-panel-fade-up overflow-hidden" style={{ animationDelay: '120ms' }}>
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="size-4 text-primary" />
                <span className="text-sm font-medium">Agenda do dia</span>
              </div>
              <CardTitle className="mt-1 text-xl text-slate-900">Agendamentos de hoje</CardTitle>
              <CardDescription>Uma leitura rápida da operação para o time acompanhar ao longo do dia.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-5 md:px-6">
            <TodayAppointmentsList appointments={dashboard.todayAppointments} />
          </CardContent>
        </Card>

        <Card className="animate-panel-fade-up overflow-hidden" style={{ animationDelay: '180ms' }}>
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock3 className="size-4 text-primary" />
              <span className="text-sm font-medium">Próximos passos</span>
            </div>
            <CardTitle className="mt-1 text-xl text-slate-900">Próximos atendimentos</CardTitle>
            <CardDescription>Os próximos compromissos confirmados para a equipe se organizar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-5 py-5">
            {dashboard.upcomingAppointments.length ? dashboard.upcomingAppointments.map((appointment, index) => (
              <div key={appointment.id} className="animate-panel-fade-up rounded-[22px] border border-slate-200/70 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)]" style={{ animationDelay: `${index * 70}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-slate-900">{appointment.patient.name}</strong>
                    <p className="mt-1 text-sm text-slate-500">{appointment.doctor.name} • {appointment.doctor.specialty}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-300" />
                </div>
                <div className="mt-3 rounded-full bg-[#f7fbfa] px-3 py-2 text-xs font-semibold text-slate-700">
                  {formatDateTimeBr(appointment.date)}
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">Sem atendimentos futuros cadastrados.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PainelSkeleton() {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 px-6 py-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-4 w-52" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between gap-4 px-5 py-5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="size-11 rounded-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_360px]">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full rounded-[24px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-[22px]" />
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
      <PageHeader className="animate-panel-fade-up">
        <PageHeaderContent>
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Dashboard</div>
          <PageTitle>Painel da clínica</PageTitle>
          <PageDescription>
            Um resumo elegante da operação para acompanhar agenda, faturamento e equipe com rapidez.
          </PageDescription>
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
