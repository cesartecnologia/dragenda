import { formatClinicAddress } from '@/helpers/format';
import dayjs from 'dayjs';

import { getServerSession } from '@/lib/auth';
import { generateAppointmentReceiptPdf } from '@/lib/pdf-documents';
import { getAppointmentByIdWithRelations, getClinicById, getUserProfileById } from '@/server/clinic-data';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.user || !session.user.clinic?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id } = await params;
  const appointment = await getAppointmentByIdWithRelations(id);
  if (!appointment || appointment.clinicId !== session.user.clinic.id) {
    return new Response('Not found', { status: 404 });
  }

  const clinic = await getClinicById(appointment.clinicId);
  const [attendant, cancelledBy] = await Promise.all([
    appointment.createdByUserId ? getUserProfileById(appointment.createdByUserId) : Promise.resolve(null),
    appointment.cancelledByUserId ? getUserProfileById(appointment.cancelledByUserId) : Promise.resolve(null),
  ]);

  const doc = await generateAppointmentReceiptPdf({
    clinic: {
      name: clinic?.name ?? 'Clínica',
      cnpj: clinic?.cnpj,
      phoneNumber: clinic?.phoneNumber,
      address: formatClinicAddress(clinic),
      logoUrl: clinic?.logoUrl,
    },
    patient: {
      name: appointment.patient.name,
      phoneNumber: appointment.patient.phoneNumber,
      email: appointment.patient.email,
      address: appointment.patient.address,
    },
    doctor: {
      name: appointment.doctor.name,
      specialty: appointment.doctor.specialty,
      crm: appointment.doctor.crm,
    },
    appointment: {
      id: appointment.id,
      date: appointment.date.toISOString(),
      appointmentPriceInCents: appointment.appointmentPriceInCents,
      paymentConfirmed: appointment.paymentConfirmed,
      paymentMethod: appointment.paymentMethod,
      paymentDate: appointment.paymentDate ? appointment.paymentDate.toISOString() : null,
      status: appointment.status,
      notes: appointment.notes,
      cancelledAt: appointment.cancelledAt ? appointment.cancelledAt.toISOString() : null,
    },
    attendantName: attendant?.name ?? session.user.name,
    cancelledByName: cancelledBy?.name ?? null,
  });

  const arrayBuffer = doc.output('arraybuffer');
  const fileName = `comprovante-agendamento-${dayjs(appointment.date).format('YYYYMMDD-HHmm')}.pdf`;

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
