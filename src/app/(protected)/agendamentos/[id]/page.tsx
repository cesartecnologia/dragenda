import { ArrowLeft, CalendarDays, CircleDollarSign, FileText, Stethoscope, UserRound } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import OpenAppointmentReceiptButton from '@/components/common/open-appointment-receipt-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageActions, PageContainer, PageContent, PageDescription, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { appointmentsTable, doctorsTable, patientsTable } from '@/db/schema';
import { getAppointmentPaymentMethodLabel, getAppointmentStatusLabel } from '@/helpers/appointments';
import { formatCurrencyInCents } from '@/helpers/currency';
import { formatPhoneNumber } from '@/helpers/format';
import { formatDateTimeBr } from '@/helpers/time';
import { requireSubscribedSession } from '@/lib/auth';
import { getAppointmentByIdWithRelations, getClinicById, getUserProfileById, listDoctorsByClinicId, listPatientsByClinicId } from '@/server/clinic-data';

import AppointmentDetailActions from './_components/appointment-detail-actions';

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

interface Props {
  params: Promise<{ id: string }>;
}

const statusBadgeClassName = (appointment: AppointmentWithRelations) =>
  appointment.status === 'cancelled'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';

export default async function AgendamentoDetalhesPage({ params }: Props) {
  const session = await requireSubscribedSession();
  const { id } = await params;
  const clinicId = session.user.clinic!.id;

  const appointment = await getAppointmentByIdWithRelations(id);
  if (!appointment || appointment.clinicId !== clinicId) {
    notFound();
  }

  const currentAppointment = appointment as AppointmentWithRelations;

  const [clinic, patients, doctors, createdBy, cancelledBy, paymentConfirmedBy] = await Promise.all([
    getClinicById(clinicId),
    listPatientsByClinicId(clinicId),
    listDoctorsByClinicId(clinicId),
    currentAppointment.createdByUserId ? getUserProfileById(currentAppointment.createdByUserId) : Promise.resolve(null),
    currentAppointment.cancelledByUserId ? getUserProfileById(currentAppointment.cancelledByUserId) : Promise.resolve(null),
    currentAppointment.paymentConfirmedByUserId ? getUserProfileById(currentAppointment.paymentConfirmedByUserId) : Promise.resolve(null),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Detalhes do agendamento</PageTitle>
          <PageDescription>
            Visualize os dados completos do atendimento e execute as ações mais importantes em um só lugar.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <Button type="button" variant="outline" asChild>
            <Link href="/agendamentos">
              <ArrowLeft className="mr-2 size-4" />Voltar
            </Link>
          </Button>
          <OpenAppointmentReceiptButton appointmentId={currentAppointment.id} label="Abrir comprovante" />
        </PageActions>
      </PageHeader>

      <PageContent className="space-y-4">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Agendamento #{currentAppointment.id.slice(0, 8).toUpperCase()}</p>
                <CardTitle className="mt-1 text-2xl">{currentAppointment.patient.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentAppointment.doctor.name} • {currentAppointment.doctor.specialty}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={statusBadgeClassName(currentAppointment)}>
                  {getAppointmentStatusLabel(currentAppointment.status)}
                </Badge>
                <Badge variant="outline" className={currentAppointment.paymentConfirmed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                  {currentAppointment.paymentConfirmed ? 'Pagamento confirmado' : 'Pagamento pendente'}
                </Badge>
                <Badge variant="secondary">{getAppointmentPaymentMethodLabel(currentAppointment.paymentMethod)}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-4 text-right">
              <p className="text-sm text-muted-foreground">Data e horário</p>
              <p className="mt-1 text-lg font-semibold">{formatDateTimeBr(currentAppointment.date)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Valor do atendimento</p>
              <p className="text-lg font-semibold">{formatCurrencyInCents(currentAppointment.appointmentPriceInCents)}</p>
            </div>
          </CardHeader>
          <CardContent>
            <AppointmentDetailActions
              appointment={currentAppointment}
              patients={patients}
              doctors={doctors}
              role={session.user.role}
              clinic={clinic}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserRound className="size-5 text-primary" />Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">Nome:</span> {currentAppointment.patient.name}</p>
                <p><span className="font-medium">Telefone:</span> {formatPhoneNumber(currentAppointment.patient.phoneNumber) || 'Não informado'}</p>
                <p><span className="font-medium">Email:</span> {currentAppointment.patient.email || 'Não informado'}</p>
                <p><span className="font-medium">Endereço:</span> {currentAppointment.patient.address || 'Não informado'}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="size-5 text-primary" />Médico responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">Nome:</span> {currentAppointment.doctor.name}</p>
                <p><span className="font-medium">Especialidade:</span> {currentAppointment.doctor.specialty}</p>
                <p><span className="font-medium">CRM:</span> {currentAppointment.doctor.crm}</p>
                <p><span className="font-medium">Valor padrão da consulta:</span> {formatCurrencyInCents(currentAppointment.doctor.appointmentPriceInCents)}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="size-5 text-primary" />Observações e histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Observações</p>
                  <p className="mt-1 text-muted-foreground">{currentAppointment.notes || 'Nenhuma observação registrada para este agendamento.'}</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <p><span className="font-medium">Criado em:</span> {formatDateTimeBr(currentAppointment.createdAt)}</p>
                  <p><span className="font-medium">Última atualização:</span> {formatDateTimeBr(currentAppointment.updatedAt)}</p>
                  <p><span className="font-medium">Cadastrado por:</span> {createdBy?.name ?? 'Usuário da clínica'}</p>
                  <p><span className="font-medium">Pagamento confirmado por:</span> {paymentConfirmedBy?.name ?? 'Ainda não confirmado'}</p>
                  <p><span className="font-medium">Status atual:</span> {getAppointmentStatusLabel(currentAppointment.status)}</p>
                  <div className="flex items-center gap-2"><span className="font-medium">Comprovante:</span> <OpenAppointmentReceiptButton appointmentId={currentAppointment.id} label="Abrir comprovante" size="sm" /></div>
                </div>
                {currentAppointment.status === 'cancelled' ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                    <p className="font-medium">Agendamento cancelado</p>
                    <p className="mt-1 text-sm">
                      {cancelledBy?.name ?? 'Usuário da clínica'}
                      {currentAppointment.cancelledAt ? ` em ${formatDateTimeBr(currentAppointment.cancelledAt)}` : ''}.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CircleDollarSign className="size-5 text-primary" />Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Situação do pagamento</p>
                  <p className="mt-1 text-lg font-semibold">{currentAppointment.paymentConfirmed ? 'Confirmado' : 'Pendente'}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Forma de pagamento</p>
                  <p className="mt-1 text-lg font-semibold">{getAppointmentPaymentMethodLabel(currentAppointment.paymentMethod)}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Data da confirmação</p>
                  <p className="mt-1 text-lg font-semibold">{currentAppointment.paymentDate ? formatDateTimeBr(currentAppointment.paymentDate) : 'Ainda não registrada'}</p>
                </div>
              </CardContent>
            </Card>

            {clinic ? (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="size-5 text-primary" />Clínica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-medium">Nome:</span> {clinic.name}</p>
                  <p><span className="font-medium">Telefone:</span> {formatPhoneNumber(clinic.phoneNumber) || 'Não informado'}</p>
                  <p><span className="font-medium">Endereço:</span> {clinic.address || 'Não informado'}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
}
