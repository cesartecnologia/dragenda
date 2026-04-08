import dayjs from 'dayjs';
import Link from 'next/link';

import DebouncedSearchForm from '@/components/common/debounced-search-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageActions, PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { normalizeSearchText } from '@/helpers/format';
import { requireSubscribedSession } from '@/lib/auth';
import { getClinicById, listAppointmentsByClinicIdWithRelations, listDoctorsByClinicId, listPatientsByClinicId } from '@/server/clinic-data';

import AppointmentsFiltersSheet from './_components/appointments-filters-sheet';
import AddAppointmentButton from '../appointments/_components/add-appointment-button';
import AppointmentsDataTable from '../appointments/_components/appointments-data-table';

interface Props {
  searchParams: Promise<{ q?: string; doctor?: string; payment?: string; from?: string; to?: string }>;
}

export default async function AgendamentosPage({ searchParams }: Props) {
  const session = await requireSubscribedSession();
  const clinicId = session.user.clinic!.id;
  const role = session.user.role;
  const rawSearchParams = await searchParams;
  const { q = '', doctor = 'all', payment = 'all', from = '', to = '' } = rawSearchParams;
  const [clinic, patients, doctors, allAppointments] = await Promise.all([
    getClinicById(clinicId),
    listPatientsByClinicId(clinicId),
    listDoctorsByClinicId(clinicId),
    listAppointmentsByClinicIdWithRelations(clinicId),
  ]);

  const normalizedQuery = normalizeSearchText(q);
  const hasAdvancedFilters = doctor !== 'all' || payment !== 'all' || Boolean(from) || Boolean(to);

  const filteredAppointments = allAppointments.filter((appointment) => {
    const matchesQuery = !normalizedQuery
      || normalizeSearchText(appointment.patient.name).includes(normalizedQuery)
      || normalizeSearchText(appointment.doctor.name).includes(normalizedQuery)
      || normalizeSearchText(appointment.doctor.specialty).includes(normalizedQuery);
    const matchesDoctor = doctor === 'all' || appointment.doctorId === doctor;
    const matchesPayment = payment === 'all' ? true : payment === 'confirmed' ? appointment.paymentConfirmed : !appointment.paymentConfirmed;
    const matchesFrom = from ? dayjs(appointment.date).isAfter(dayjs(from).subtract(1, 'day')) : true;
    const matchesTo = to ? dayjs(appointment.date).isBefore(dayjs(to).add(1, 'day')) : true;

    return matchesQuery && matchesDoctor && matchesPayment && matchesFrom && matchesTo;
  });

  const selectedDoctor = doctors.find((item) => item.id === doctor);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
        </PageHeaderContent>
        <PageActions>
          <AddAppointmentButton patients={patients} doctors={doctors} />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-4">
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 lg:max-w-xl">
              <DebouncedSearchForm
                placeholder="Buscar paciente, médico ou especialidade"
                initialValue={q}
                preserveParams={['doctor', 'payment', 'from', 'to']}
              />
            </div>

            <div className="flex items-center gap-2">
              <AppointmentsFiltersSheet doctors={doctors} q={q} doctor={doctor} payment={payment} from={from} to={to} />
              {hasAdvancedFilters ? (
                <Button type="button" variant="ghost" className="rounded-xl" asChild>
                  <Link href={q ? `/agendamentos?q=${encodeURIComponent(q)}` : '/agendamentos'}>Limpar filtros</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
            <span>
              {filteredAppointments.length} {filteredAppointments.length === 1 ? 'agendamento encontrado' : 'agendamentos encontrados'}
            </span>

            {hasAdvancedFilters ? (
              <div className="flex flex-wrap gap-2">
                {selectedDoctor ? <Badge variant="secondary">Médico: {selectedDoctor.name}</Badge> : null}
                {payment !== 'all' ? (
                  <Badge variant="secondary">
                    {payment === 'confirmed' ? 'Pagamento confirmado' : 'Pagamento pendente'}
                  </Badge>
                ) : null}
                {from ? <Badge variant="secondary">De: {dayjs(from).format('DD/MM/YYYY')}</Badge> : null}
                {to ? <Badge variant="secondary">Até: {dayjs(to).format('DD/MM/YYYY')}</Badge> : null}
              </div>
            ) : null}
          </div>
        </div>

        <AppointmentsDataTable data={filteredAppointments} patients={patients} doctors={doctors} role={role} clinic={clinic} />
      </PageContent>
    </PageContainer>
  );
}
