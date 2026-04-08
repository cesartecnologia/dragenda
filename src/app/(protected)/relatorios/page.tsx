import dayjs from 'dayjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageContainer, PageContent, PageHeader, PageHeaderContent, PageTitle } from '@/components/ui/page-container';
import { formatCurrencyInCents } from '@/helpers/currency';
import { formatDateTimeBr } from '@/helpers/time';
import { canAccessReports } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';
import { getClinicById, listAppointmentsByClinicIdWithRelations, listDoctorsByClinicId } from '@/server/clinic-data';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; doctor?: string; payment?: string }>;
}

export default async function RelatoriosPage({ searchParams }: Props) {
  const session = await requireSubscribedSession();
  if (!canAccessReports(session.user.role)) redirect('/agendamentos');
  const clinicId = session.user.clinic!.id;
  const clinic = await getClinicById(clinicId);
  const doctors = await listDoctorsByClinicId(clinicId);
  const { from = dayjs().startOf('month').format('YYYY-MM-DD'), to = dayjs().endOf('month').format('YYYY-MM-DD'), doctor = 'all', payment = 'all' } = await searchParams;

  const appointments = (await listAppointmentsByClinicIdWithRelations(clinicId)).filter((appointment) => {
    const inRange = dayjs(appointment.date).isAfter(dayjs(from).subtract(1, 'day')) && dayjs(appointment.date).isBefore(dayjs(to).add(1, 'day'));
    const paymentMatch = payment === 'all' ? true : payment === 'confirmed' ? appointment.paymentConfirmed : !appointment.paymentConfirmed;
    const doctorMatch = doctor === 'all' ? true : appointment.doctorId === doctor;
    return appointment.status !== 'cancelled' && inRange && paymentMatch && doctorMatch;
  });

  const totalConfirmed = appointments.filter((a) => a.paymentConfirmed).reduce((acc, appointment) => acc + appointment.appointmentPriceInCents, 0);
  const pendingTotal = appointments.filter((a) => !a.paymentConfirmed).reduce((acc, appointment) => acc + appointment.appointmentPriceInCents, 0);
  const confirmedCount = appointments.filter((a) => a.paymentConfirmed).length;
  const pendingCount = appointments.length - confirmedCount;

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Relatórios</PageTitle>
        </PageHeaderContent>
      </PageHeader>
      <PageContent className="space-y-4">
        <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-5">
          <Input type="date" name="from" defaultValue={from} />
          <Input type="date" name="to" defaultValue={to} />
          <select className="flex h-10 rounded-md border bg-background px-3 text-sm" name="doctor" defaultValue={doctor}>
            <option value="all">Todos os médicos</option>
            {doctors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="flex h-10 rounded-md border bg-background px-3 text-sm" name="payment" defaultValue={payment}>
            <option value="all">Todos os pagamentos</option>
            <option value="confirmed">Pagos</option>
            <option value="pending">Pendentes</option>
          </select>
          <div className="flex gap-2">
            <Button type="submit">Filtrar</Button>
            <Button variant="outline" asChild>
              <Link href={`/api/relatorios/pdf?from=${from}&to=${to}&payment=${payment}&doctor=${doctor}`} target="_blank">Gerar PDF</Link>
            </Button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-base">Receita confirmada</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrencyInCents(totalConfirmed)}</p><p className="text-sm text-muted-foreground">{confirmedCount} pagamento(s) confirmado(s)</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Em aberto</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatCurrencyInCents(pendingTotal)}</p><p className="text-sm text-muted-foreground">{pendingCount} pagamento(s) pendente(s)</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Período</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{appointments.length}</p><p className="text-sm text-muted-foreground">Atendimento(s) no relatório de {clinic?.name ?? 'Clínica'}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>{clinic?.name ?? 'Clínica'} — lançamentos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {appointments.length ? appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2"><strong>{appointment.patient.name}</strong><span>{formatDateTimeBr(appointment.date)}</span></div>
                <div className="text-muted-foreground">{appointment.doctor.name} • {appointment.doctor.specialty}</div>
                <div className="mt-1 flex items-center justify-between gap-4"><span>{appointment.paymentConfirmed ? 'Pagamento confirmado' : 'Pagamento pendente'}</span><span>{formatCurrencyInCents(appointment.appointmentPriceInCents)}</span></div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Nenhum resultado encontrado para os filtros selecionados.</p>}
          </CardContent>
        </Card>
      </PageContent>
    </PageContainer>
  );
}
