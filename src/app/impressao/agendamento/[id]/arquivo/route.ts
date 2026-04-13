import { generateAppointmentReceiptPdf } from '@/lib/pdf-documents';
import { requireSession } from '@/lib/auth';
import { getAppointmentById, getClinicById, getDoctorById, getPatientById, getUserProfileById } from '@/server/clinic-data';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;

  const appointment = await getAppointmentById(id);
  if (!appointment) return new Response('Agendamento nao encontrado.', { status: 404 });
  if (session.user.clinic?.id && appointment.clinicId !== session.user.clinic.id) return new Response('Agendamento nao encontrado.', { status: 404 });

  const [clinic, patient, doctor, createdBy, cancelledBy] = await Promise.all([
    getClinicById(appointment.clinicId),
    getPatientById(appointment.patientId),
    getDoctorById(appointment.doctorId),
    appointment.createdByUserId ? getUserProfileById(appointment.createdByUserId) : Promise.resolve(null),
    appointment.cancelledByUserId ? getUserProfileById(appointment.cancelledByUserId) : Promise.resolve(null),
  ]);

  if (!clinic || !patient || !doctor) return new Response('Dados do comprovante indisponiveis.', { status: 404 });

  const doc = await generateAppointmentReceiptPdf({
    clinic: {
      name: clinic.name,
      cnpj: clinic.cnpj,
      phoneNumber: clinic.phoneNumber,
      address: clinic.address,
      logoUrl: clinic.logoUrl,
    },
    patient: {
      name: patient.name,
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      address: patient.address,
    },
    doctor: {
      name: doctor.name,
      specialty: doctor.specialty,
      crm: doctor.crm,
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
    attendantName: createdBy?.name ?? session.user.name,
    cancelledByName: cancelledBy?.name ?? null,
  });

  try {
    (doc as { autoPrint?: (options?: { variant?: string }) => void }).autoPrint?.({ variant: 'non-conform' });
  } catch {}

  const pdfBytes = doc.output('arraybuffer');
  const fileName = `comprovante-agendamento-${patient.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'paciente'}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
