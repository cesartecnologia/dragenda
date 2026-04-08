import dayjs from 'dayjs';
import { NextRequest } from 'next/server';

import { getServerSession } from '@/lib/auth';
import { generateReportPdf } from '@/lib/pdf-documents';
import { listAppointmentsByClinicIdWithRelations, listDoctorsByClinicId, getClinicById } from '@/server/clinic-data';
import { canAccessReports } from '@/lib/access';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || !session.user.clinic?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!canAccessReports(session.user.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  const clinicId = session.user.clinic.id;
  const params = request.nextUrl.searchParams;
  const from = params.get('from') || dayjs().startOf('month').format('YYYY-MM-DD');
  const to = params.get('to') || dayjs().endOf('month').format('YYYY-MM-DD');
  const doctor = params.get('doctor') || 'all';
  const payment = params.get('payment') || 'all';

  const [clinic, doctors, appointments] = await Promise.all([
    getClinicById(clinicId),
    listDoctorsByClinicId(clinicId),
    listAppointmentsByClinicIdWithRelations(clinicId),
  ]);

  const filteredAppointments = appointments.filter((appointment) => {
    const inRange = dayjs(appointment.date).isAfter(dayjs(from).subtract(1, 'day')) && dayjs(appointment.date).isBefore(dayjs(to).add(1, 'day'));
    const paymentMatch = payment === 'all' ? true : payment === 'confirmed' ? appointment.paymentConfirmed : !appointment.paymentConfirmed;
    const doctorMatch = doctor === 'all' ? true : appointment.doctorId === doctor;
    return appointment.status !== 'cancelled' && inRange && paymentMatch && doctorMatch;
  });

  const doctorName = doctor === 'all' ? 'Todos os médicos' : doctors.find((item) => item.id === doctor)?.name ?? 'Médico';
  const paymentLabel = payment === 'all' ? 'Todos' : payment === 'confirmed' ? 'Pagos' : 'Pendentes';
  const totalConfirmedInCents = filteredAppointments.filter((item) => item.paymentConfirmed).reduce((sum, item) => sum + item.appointmentPriceInCents, 0);
  const totalPendingInCents = filteredAppointments.filter((item) => !item.paymentConfirmed).reduce((sum, item) => sum + item.appointmentPriceInCents, 0);

  const doc = await generateReportPdf({
    clinic: {
      name: clinic?.name ?? 'Clínica',
      cnpj: clinic?.cnpj,
      phoneNumber: clinic?.phoneNumber,
      address: clinic?.address,
      logoUrl: clinic?.logoUrl,
    },
    generatedAt: new Date().toISOString(),
    from,
    to,
    doctorName,
    paymentLabel,
    totalConfirmedInCents,
    totalPendingInCents,
    appointmentsCount: filteredAppointments.length,
    appointments: filteredAppointments.map((item) => ({
      patientName: item.patient.name,
      patientPhone: item.patient.phoneNumber,
      doctorName: item.doctor.name,
      specialty: item.doctor.specialty,
      date: item.date.toISOString(),
      paymentConfirmed: item.paymentConfirmed,
      paymentMethod: item.paymentMethod,
      valueInCents: item.appointmentPriceInCents,
      status: item.status,
    })),
  });

  const arrayBuffer = doc.output('arraybuffer');
  const fileName = `relatorio-${dayjs().format('YYYYMMDD-HHmm')}.pdf`;

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
