import { Suspense } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import DebouncedSearchForm from '@/components/common/debounced-search-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import type { AppointmentStatus } from '@/db/schema';
import { normalizeSearchText } from '@/helpers/format';
import { endOfBrazilDay, formatDateBr, startOfBrazilDay } from '@/helpers/time';
import { requireSubscribedSession } from '@/lib/auth';
import {
  listAppointmentsByClinicIdWithRelations,
  listAppointmentsByClinicIdWithRelationsFiltered,
  listDoctorsByClinicId,
  listRecentAppointmentsByClinicIdWithRelations,
} from '@/server/clinic-data';

import AppointmentsFiltersSheet from './_components/appointments-filters-sheet';
import AddAppointmentButton from '../appointments/_components/add-appointment-button';
import AppointmentsDataTable from '../appointments/_components/appointments-data-table';

interface Props {
  searchParams: Promise<{ q?: string; doctor?: string; payment?: string; status?: string; from?: string; to?: string; view?: string }>;
}

type AgendamentosSearchParams = {
  q?: string;
  doctor?: string;
  payment?: string;
  status?: string;
  from?: string;
  to?: string;
  view?: string;
};

const AppointmentsCalendarView = dynamic(() => import('./_components/appointments-calendar-view'));

function AgendamentosContentSkeleton() {
  return (
    <>
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-44 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
            <Skeleton className="h-11 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-white p-4 shadow-sm">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-2 h-4 w-28" />
            <Skeleton className="mt-6 h-20 w-full" />
          </div>
        ))}
      </div>
    </>
  );
}

async function AgendamentosDataSection({
  sessionPromise,
  searchParamsPromise,
}: {
  sessionPromise: ReturnType<typeof requireSubscribedSession>;
  searchParamsPromise: Props['searchParams'];
}) {
  const [session, rawSearchParams] = await Promise.all([sessionPromise, searchParamsPromise]);
  const clinicId = session.user.clinic!.id;
  const role = session.user.role;
  const { q = '', doctor = 'all', payment = 'all', status = 'all', from = '', to = '', view = 'cards' } = rawSearchParams;
  const isCalendarView = view === 'calendar';
  const normalizedQuery = normalizeSearchText(q);
  const hasDateFilter = Boolean(from) || Boolean(to);
  const hasStructuredFilters = doctor !== 'all' || payment !== 'all' || status !== 'all' || hasDateFilter;
  const showResultsSummary = Boolean(normalizedQuery) || hasStructuredFilters;

  const fromDate = from ? startOfBrazilDay(from) : null;
  const toDate = to ? endOfBrazilDay(to) : null;
  const paymentConfirmed = payment === 'all' ? null : payment === 'confirmed';
  const statusFilter: AppointmentStatus | null = status === 'all' ? null : (status as AppointmentStatus);
  const doctorFilter = doctor === 'all' ? null : doctor;

  const appointmentsPromise = normalizedQuery
    ? hasStructuredFilters
      ? listAppointmentsByClinicIdWithRelationsFiltered(clinicId, {
          doctorId: doctorFilter,
          paymentConfirmed,
          status: statusFilter,
          from: fromDate,
          to: toDate,
        })
      : listAppointmentsByClinicIdWithRelations(clinicId)
    : hasStructuredFilters
      ? listAppointmentsByClinicIdWithRelationsFiltered(clinicId, {
          doctorId: doctorFilter,
          paymentConfirmed,
          status: statusFilter,
          from: fromDate,
          to: toDate,
          limit: hasDateFilter ? undefined : 160,
        })
      : listRecentAppointmentsByClinicIdWithRelations(clinicId, 120);

  const [doctors, baseAppointments] = await Promise.all([
    listDoctorsByClinicId(clinicId),
    appointmentsPromise,
  ]);

  const filteredAppointments = normalizedQuery
    ? baseAppointments.filter((appointment) =>
        normalizeSearchText(appointment.patient.name).includes(normalizedQuery)
        || normalizeSearchText(appointment.doctor.name).includes(normalizedQuery)
        || normalizeSearchText(appointment.doctor.specialty).includes(normalizedQuery),
      )
    : baseAppointments;

  const selectedDoctor = doctors.find((item) => item.id === doctor);
  const viewToggleParams = new URLSearchParams();

  Object.entries(rawSearchParams).forEach(([key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      viewToggleParams.set(key, value);
    }
  });

  const cardsViewHref = (() => {
    const params = new URLSearchParams(viewToggleParams);
    params.delete('view');
    const query = params.toString();
    return query ? `/agendamentos?${query}` : '/agendamentos';
  })();

  const calendarViewHref = (() => {
    const params = new URLSearchParams(viewToggleParams);
    params.set('view', 'calendar');
    const query = params.toString();
    return query ? `/agendamentos?${query}` : '/agendamentos?view=calendar';
  })();

  const clearFiltersHref = (() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (isCalendarView) params.set('view', 'calendar');
    const query = params.toString();
    return query ? `/agendamentos?${query}` : '/agendamentos';
  })();

  return (
    <>
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <DebouncedSearchForm
                placeholder="Buscar paciente, médico ou especialidade"
                initialValue={q}
                preserveParams={['doctor', 'payment', 'status', 'from', 'to', 'view']}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <Button type="button" size="sm" variant={isCalendarView ? 'ghost' : 'secondary'} className="rounded-lg px-3" asChild>
                  <Link href={cardsViewHref}>Cards</Link>
                </Button>
                <Button type="button" size="sm" variant={isCalendarView ? 'secondary' : 'ghost'} className="rounded-lg px-3" asChild>
                  <Link href={calendarViewHref}>Calendario</Link>
                </Button>
              </div>

              <AddAppointmentButton />
              <AppointmentsFiltersSheet doctors={doctors} q={q} doctor={doctor} payment={payment} status={status} from={from} to={to} view={view} />
              {hasStructuredFilters ? (
                <Button type="button" variant="ghost" className="rounded-xl" asChild>
                  <Link href={clearFiltersHref}>Limpar filtros</Link>
                </Button>
              ) : null}
            </div>
          </div>

          {showResultsSummary ? (
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
              <span>
                {filteredAppointments.length} {filteredAppointments.length === 1 ? 'agendamento encontrado' : 'agendamentos encontrados'}
              </span>

              <div className="flex flex-wrap gap-2">
                {selectedDoctor ? <Badge variant="secondary">Médico: {selectedDoctor.name}</Badge> : null}
                {payment !== 'all' ? (
                  <Badge variant="secondary">
                    {payment === 'confirmed' ? 'Pagamento confirmado' : 'Pagamento pendente'}
                  </Badge>
                ) : null}
                {status !== 'all' ? (
                  <Badge variant="secondary">
                    {status === 'scheduled' ? 'Agendada' : status === 'completed' ? 'Consulta concluída' : 'Cancelada'}
                  </Badge>
                ) : null}
                {from ? <Badge variant="secondary">De: {formatDateBr(startOfBrazilDay(from))}</Badge> : null}
                {to ? <Badge variant="secondary">Até: {formatDateBr(startOfBrazilDay(to))}</Badge> : null}
              </div>
            </div>
          ) : null}
        </div>

      {isCalendarView ? (
        <AppointmentsCalendarView appointments={filteredAppointments} initialDate={from || undefined} />
      ) : (
        <AppointmentsDataTable data={filteredAppointments} role={role} clinic={null} variant="cards" />
      )}
    </>
  );
}

export default async function AgendamentosPage({ searchParams }: Props) {
  const sessionPromise = requireSubscribedSession();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
        </PageHeaderContent>
      </PageHeader>

      <PageContent className="w-full space-y-4">
        <Suspense fallback={<AgendamentosContentSkeleton />}>
          <AgendamentosDataSection sessionPromise={sessionPromise} searchParamsPromise={searchParams} />
        </Suspense>
      </PageContent>
    </PageContainer>
  );
}

