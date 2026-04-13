import dayjs from 'dayjs';
import { Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import PrintButton from '@/components/common/print-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { formatCurrencyInCents } from '@/helpers/currency';
import { formatClinicAddress, formatCnpj, formatPhoneNumber } from '@/helpers/format';
import { formatDateBr, formatDateTimeBr } from '@/helpers/time';
import { requireSubscribedSession } from '@/lib/auth';
import { getClinicById, getDoctorById, getPatientById, listAppointmentsByDoctorId } from '@/server/clinic-data';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AgendaMedicoPage({ params, searchParams }: Props) {
  await requireSubscribedSession();
  const { id } = await params;
  const { from = dayjs().startOf('month').format('YYYY-MM-DD'), to = dayjs().endOf('month').format('YYYY-MM-DD') } = await searchParams;
  const doctor = await getDoctorById(id);
  if (!doctor) notFound();

  const [clinic, doctorAppointments] = await Promise.all([getClinicById(doctor.clinicId), listAppointmentsByDoctorId(doctor.id)]);

  const appointments = (await Promise.all(
    doctorAppointments.map(async (appointment) => {
      if (appointment.status === 'cancelled') return null;
      if (dayjs(appointment.date).isBefore(dayjs(from).startOf('day')) || dayjs(appointment.date).isAfter(dayjs(to).endOf('day'))) return null;
      const patient = await getPatientById(appointment.patientId);
      if (!patient) return null;
      return { ...appointment, patient };
    }),
  ))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const groupedByDay = appointments.reduce<Record<string, typeof appointments>>((acc, appointment) => {
    const key = dayjs(appointment.date).format('YYYY-MM-DD');
    acc[key] = acc[key] ?? [];
    acc[key].push(appointment);
    return acc;
  }, {});

  const shareLines = [
    `Agenda do médico ${doctor.name}`,
    `Período: ${dayjs(from).format('DD/MM/YYYY')} a ${dayjs(to).format('DD/MM/YYYY')}`,
    ...appointments.slice(0, 15).map((appointment) => `${formatDateTimeBr(appointment.date)} - ${appointment.patient.name}`),
    appointments.length > 15 ? `... e mais ${appointments.length - 15} agendamento(s).` : '',
  ].filter(Boolean);
  const whatsappMessage = encodeURIComponent(shareLines.join('\n'));
  const mailSubject = encodeURIComponent(`Agenda do médico ${doctor.name}`);
  const mailBody = encodeURIComponent(shareLines.join('\n'));

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agenda do médico</PageTitle>
        </PageHeaderContent>
      </PageHeader>
      <PageContent className="space-y-4 print:bg-white print:text-black">
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle>{doctor.name}</CardTitle>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{doctor.specialty} • CRM {doctor.crm}</p>
              <p>Consulta padrão: {formatCurrencyInCents(doctor.appointmentPriceInCents)}</p>
              {clinic ? <><p>{clinic.name}</p>{clinic.cnpj ? <p>CNPJ: {formatCnpj(clinic.cnpj)}</p> : null}{clinic.phoneNumber ? <p>Telefone: {formatPhoneNumber(clinic.phoneNumber)}</p> : null}{formatClinicAddress(clinic) ? <p>{formatClinicAddress(clinic)}</p> : null}</> : null}
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input type="date" name="from" defaultValue={from} />
              <Input type="date" name="to" defaultValue={to} />
              <div className="flex gap-2">
                <Button type="submit">Filtrar</Button>
                <PrintButton />
              </div>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" asChild><a href={`https://wa.me/?text=${whatsappMessage}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 size-4" /> WhatsApp</a></Button>
              <Button variant="outline" asChild><a href={`mailto:?subject=${mailSubject}&body=${mailBody}`}><Mail className="mr-2 size-4" /> Email</a></Button>
              <Button variant="outline" asChild><Link href="/medicos">Voltar</Link></Button>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none">
          <CardHeader><CardTitle>{appointments.length} agendamento(s) no período</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(groupedByDay).length ? Object.entries(groupedByDay).map(([date, dayAppointments]) => (
              <div key={date} className="space-y-3">
                <div className="border-b pb-2"><h2 className="font-semibold">{formatDateBr(new Date(date))}</h2><p className="text-sm text-muted-foreground">{dayAppointments.length} atendimento(s)</p></div>
                <div className="space-y-2">
                  {dayAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div><p className="font-medium">{appointment.patient.name}</p><p className="text-sm text-muted-foreground">{appointment.patient.phoneNumber ? formatPhoneNumber(appointment.patient.phoneNumber) : 'Sem telefone'}{appointment.patient.email ? ` • ${appointment.patient.email}` : ''}</p></div>
                        <div className="text-right"><p className="font-medium">{dayjs(appointment.date).format('HH:mm')}</p><p className="text-sm text-muted-foreground">{appointment.paymentConfirmed ? 'Pagamento confirmado' : 'Pagamento pendente'}</p></div>
                      </div>
                      {appointment.notes ? <p className="mt-2 text-sm text-muted-foreground">Observações: {appointment.notes}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado para o período selecionado.</p>}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}
