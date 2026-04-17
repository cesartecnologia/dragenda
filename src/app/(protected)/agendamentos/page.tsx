import dayjs from 'dayjs';
import Link from 'next/link';

import DebouncedSearchForm from '@/components/common/debounced-search-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import type { AppointmentStatus } from '@/db/schema';
import { normalizeSearchText } from '@/helpers/format';
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
  searchParams: Promise<{ q?: string; doctor?: string; payment?: string; status?: string; from?: string; to?: string }>;
}

export default async function AgendamentosPage({ searchParams }: Props) {
  const session = await requireSubscribedSession();
  const clinicId = session.user.clinic!.id;
  const role = session.user.role;
  const rawSearchParams = await searchParams;
  const { q = '', doctor = 'all', payment = 'all', status = 'all', from = '', to = '' } = rawSearchParams;
  const normalizedQuery = normalizeSearchText(q);
  const hasDateFilter = Boolean(from) || Boolean(to);
  const hasStructuredFilters = doctor !== 'all' || payment !== 'all' || status !== 'all' || hasDateFilter;
  const showResultsSummary = Boolean(normalizedQuery) || hasStructuredFilters;

  const fromDate = from ? dayjs(from).startOf('day').toDate() : null;
  const toDate = to ? dayjs(to).endOf('day').toDate() : null;
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

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
        </PageHeaderContent>
      </PageHeader>

      <PageContent className="w-full space-y-4">
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <DebouncedSearchForm
                placeholder="Buscar paciente, médico ou especialidade"
                initialValue={q}
                preserveParams={['doctor', 'payment', 'status', 'from', 'to']}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <AddAppointmentButton />
              <AppointmentsFiltersSheet doctors={doctors} q={q} doctor={doctor} payment={payment} status={status} from={from} to={to} />
              {hasStructuredFilters ? (
                <Button type="button" variant="ghost" className="rounded-xl" asChild>
                  <Link href={q ? `/agendamentos?q=${encodeURIComponent(q)}` : '/agendamentos'}>Limpar filtros</Link>
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
                {from ? <Badge variant="secondary">De: {dayjs(from).format('DD/MM/YYYY')}</Badge> : null}
                {to ? <Badge variant="secondary">Até: {dayjs(to).format('DD/MM/YYYY')}</Badge> : null}
              </div>
            </div>
          ) : null}
        </div>

        <AppointmentsDataTable data={filteredAppointments} role={role} clinic={null} variant="cards" />
      </PageContent>
    </PageContainer>
  );
}
