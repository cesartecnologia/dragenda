import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import AutoPrint from '@/components/common/auto-print';
import PrintButton from '@/components/common/print-button';
import { Button } from '@/components/ui/button';
import { formatClinicAddress } from '@/helpers/clinic-address';
import { formatCurrencyInCents } from '@/helpers/currency';
import { formatCnpj, formatPhoneNumber } from '@/helpers/format';
import { formatDateBr, formatDateTimeBr } from '@/helpers/time';
import { canAccessReports } from '@/lib/access';
import { requireSubscribedSession } from '@/lib/auth';
import { getClinicById, listAppointmentsByClinicIdWithRelations, listDoctorsByClinicId } from '@/server/clinic-data';

interface Props { searchParams: Promise<{ from?: string; to?: string; payment?: string; doctor?: string }> }

export default async function RelatorioImpressaoPage({ searchParams }: Props) {
  const session = await requireSubscribedSession();
  if (!canAccessReports(session.user.role)) redirect('/agendamentos');

  const clinicId = session.user.clinic!.id;
  const clinic = await getClinicById(clinicId);
  const doctors = await listDoctorsByClinicId(clinicId);
  const { from = dayjs().startOf('month').format('YYYY-MM-DD'), to = dayjs().endOf('month').format('YYYY-MM-DD'), payment = 'all', doctor = 'all' } = await searchParams;
  const doctorName = doctor === 'all' ? 'Todos os médicos' : doctors.find((item) => item.id === doctor)?.name ?? 'Médico';
  const paymentLabel = payment === 'all' ? 'Todos' : payment === 'confirmed' ? 'Confirmados' : 'Pendentes';

  const appointments = (await listAppointmentsByClinicIdWithRelations(clinicId)).filter((appointment) => {
    const inRange = dayjs(appointment.date).isAfter(dayjs(from).subtract(1, 'day')) && dayjs(appointment.date).isBefore(dayjs(to).add(1, 'day'));
    const paymentMatch = payment === 'all' ? true : payment === 'confirmed' ? appointment.paymentConfirmed : !appointment.paymentConfirmed;
    const doctorMatch = doctor === 'all' ? true : appointment.doctorId === doctor;
    return appointment.status !== 'cancelled' && inRange && paymentMatch && doctorMatch;
  });

  const confirmed = appointments.filter((item) => item.paymentConfirmed);
  const totalConfirmed = confirmed.reduce((acc, item) => acc + item.appointmentPriceInCents, 0);
  const totalPending = appointments.filter((item) => !item.paymentConfirmed).reduce((acc, item) => acc + item.appointmentPriceInCents, 0);

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-black">
      <AutoPrint />
      <div className="mx-auto max-w-5xl bg-white print:max-w-none">
        <div className="mb-5 flex items-start justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-base font-semibold text-slate-800">Relatório para impressão</h1>
            <p className="text-sm text-slate-500">A janela de impressão será aberta automaticamente.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild><Link href="/relatorios">Voltar</Link></Button>
            <PrintButton label="Imprimir / Salvar PDF" />
          </div>
        </div>

        <article className="border border-slate-200 bg-white px-8 py-7 shadow-sm print:border-0 print:px-0 print:py-0 print:shadow-none">
          <header className="border-b border-slate-300 pb-4">
            <div className="flex items-start gap-4">
              {clinic?.logoUrl ? (
                <div className="relative h-16 w-20 shrink-0 overflow-hidden bg-white">
                  <Image src={clinic.logoUrl} alt={clinic.name} fill className="object-contain" sizes="80px" />
                </div>
              ) : null}
              <div className="flex-1">
                <h1 className="text-lg font-bold uppercase tracking-wide">{clinic?.name ?? 'Clínica'}</h1>
                {clinic ? (() => { const formattedClinicAddress = formatClinicAddress(clinic); return formattedClinicAddress ? <div className="mt-1 text-[13px] leading-5 text-slate-700">{formattedClinicAddress}</div> : null; })() : null}
                <div className="text-[13px] leading-5 text-slate-700">
                  {clinic?.phoneNumber ? `Tel: ${formatPhoneNumber(clinic.phoneNumber)}` : null}
                  {clinic?.phoneNumber && clinic?.cnpj ? ' | ' : null}
                  {clinic?.cnpj ? `CNPJ: ${formatCnpj(clinic.cnpj)}` : null}
                </div>
              </div>
            </div>
          </header>

          <section className="pt-4 text-[13px] leading-6 text-slate-800">
            <h2 className="text-base font-bold">Relatório de Agendamentos</h2>
            <p>Período: {formatDateBr(from)} a {formatDateBr(to)}</p>
            <p>Médico: {doctorName}</p>
            <p>Pagamento: {paymentLabel}</p>
          </section>

          <section className="mt-5 text-[13px] leading-6 text-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wide">Resumo</h3>
            <div className="mt-1 space-y-0.5">
              <p>Total de Agendamentos: {appointments.length}</p>
              <p>Pagamentos Confirmados: {confirmed.length}</p>
              <p>Pagamentos Pendentes: {appointments.length - confirmed.length}</p>
              <p>Faturamento Confirmado: {formatCurrencyInCents(totalConfirmed)}</p>
              <p>Faturamento Pendente: {formatCurrencyInCents(totalPending)}</p>
            </div>
          </section>

          <section className="mt-5 overflow-hidden border border-slate-300">
            <table className="w-full border-collapse text-[12.5px] leading-5">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="border-b border-slate-300 px-3 py-2 font-semibold">Paciente</th>
                  <th className="border-b border-slate-300 px-3 py-2 font-semibold">Médico</th>
                  <th className="border-b border-slate-300 px-3 py-2 font-semibold">Data</th>
                  <th className="border-b border-slate-300 px-3 py-2 font-semibold">Pagamento</th>
                  <th className="border-b border-slate-300 px-3 py-2 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length ? appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="border-b border-slate-200 px-3 py-2 align-top">{appointment.patient.name}</td>
                    <td className="border-b border-slate-200 px-3 py-2 align-top">
                      <div>{appointment.doctor.name}</div>
                      <div className="text-[11px] text-slate-500">{appointment.doctor.specialty}</div>
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2 align-top">{formatDateTimeBr(appointment.date)}</td>
                    <td className="border-b border-slate-200 px-3 py-2 align-top">{appointment.paymentConfirmed ? 'Confirmado' : 'Pendente'}</td>
                    <td className="border-b border-slate-200 px-3 py-2 text-right align-top">{formatCurrencyInCents(appointment.appointmentPriceInCents)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-3 py-5 text-center text-slate-500" colSpan={5}>Nenhum resultado encontrado para os filtros selecionados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <footer className="mt-4 text-[11px] text-slate-500">
            Gerado em {dayjs().format('DD/MM/YYYY HH:mm')}
          </footer>
        </article>
      </div>
    </div>
  );
}
