'use server';

import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

import { combineDateAndTime, isPastDate, isPastDateTime } from '@/helpers/time';
import { auth } from '@/lib/auth';
import { actionClient } from '@/lib/next-safe-action';
import {
  createAppointmentRecord,
  getAppointmentById,
  getDoctorById,
  getPatientById,
  listAppointmentsByDoctorId,
  updateAppointmentRecord,
} from '@/server/clinic-data';

import { getAvailableTimes } from '../get-available-times';
import { addAppointmentSchema } from './schema';

export const addAppointment = actionClient.schema(addAppointmentSchema).action(async ({ parsedInput }) => {
  const session = await auth.api.getSession();
  if (!session?.user) throw new Error('Unauthorized');
  if (!session.user.clinic?.id) throw new Error('Clinic not found');

  if (isPastDate(parsedInput.date)) {
    throw new Error('Não é permitido agendar em datas anteriores ao dia atual.');
  }

  if (isPastDateTime(parsedInput.date, parsedInput.time)) {
    throw new Error('Não é permitido agendar em horários anteriores ao atual.');
  }

  const [doctor, patient, availableTimes, existingAppointment, doctorAppointments] = await Promise.all([
    getDoctorById(parsedInput.doctorId),
    getPatientById(parsedInput.patientId),
    getAvailableTimes({
      doctorId: parsedInput.doctorId,
      date: parsedInput.date.toISOString().slice(0, 10),
      appointmentId: parsedInput.id,
    }),
    parsedInput.id ? getAppointmentById(parsedInput.id) : Promise.resolve(null),
    listAppointmentsByDoctorId(parsedInput.doctorId),
  ]);

  if (!doctor || doctor.clinicId !== session.user.clinic.id) throw new Error('Doctor not found');
  if (!patient || patient.clinicId !== session.user.clinic.id) throw new Error('Patient not found');
  if (!availableTimes?.data) throw new Error('No available times');

  const normalizedInputTime = parsedInput.time.length === 5 ? `${parsedInput.time}:00` : parsedInput.time;
  const normalizedInputDate = dayjs(parsedInput.date).format('YYYY-MM-DD');

  const hasConflict = doctorAppointments.some((appointment) => {
    if (appointment.id === parsedInput.id || appointment.status === 'cancelled') return false;
    return dayjs(appointment.date).format('YYYY-MM-DD') === normalizedInputDate && dayjs(appointment.date).format('HH:mm:ss') === normalizedInputTime;
  });

  if (hasConflict) {
    throw new Error('Este horário já está ocupado para o médico selecionado.');
  }

  const isEditingSameSlot = Boolean(
    existingAppointment &&
      existingAppointment.doctorId === parsedInput.doctorId &&
      dayjs(existingAppointment.date).format('YYYY-MM-DD') === normalizedInputDate &&
      dayjs(existingAppointment.date).format('HH:mm:ss') === normalizedInputTime,
  );

  const isTimeAvailable = availableTimes.data.some((time) => time.value === normalizedInputTime && time.available) || isEditingSameSlot;
  if (!isTimeAvailable) throw new Error('Time not available');

  const appointmentDateTime = combineDateAndTime(parsedInput.date, parsedInput.time);
  const paymentConfirmed = Boolean(parsedInput.paymentConfirmed);
  const paymentMethod = paymentConfirmed ? parsedInput.paymentMethod ?? existingAppointment?.paymentMethod ?? 'pix' : null;
  const paymentDate = paymentConfirmed ? existingAppointment?.paymentDate ?? new Date() : null;
  const paymentConfirmedByUserId = paymentConfirmed ? existingAppointment?.paymentConfirmedByUserId ?? session.user.id : null;

  if (parsedInput.id) {
    await updateAppointmentRecord({
      id: parsedInput.id,
      patientId: parsedInput.patientId,
      doctorId: parsedInput.doctorId,
      appointmentPriceInCents: parsedInput.appointmentPriceInCents,
      date: appointmentDateTime,
      notes: parsedInput.notes,
      status: existingAppointment?.status ?? 'scheduled',
      cancelledAt: existingAppointment?.cancelledAt ?? null,
      cancelledByUserId: existingAppointment?.cancelledByUserId ?? null,
      createdByUserId: existingAppointment?.createdByUserId ?? session.user.id,
      paymentConfirmed,
      paymentMethod,
      paymentDate,
      paymentConfirmedByUserId,
    });
  } else {
    await createAppointmentRecord({
      clinicId: session.user.clinic.id,
      patientId: parsedInput.patientId,
      doctorId: parsedInput.doctorId,
      appointmentPriceInCents: parsedInput.appointmentPriceInCents,
      date: appointmentDateTime,
      notes: parsedInput.notes,
      createdByUserId: session.user.id,
      paymentConfirmed,
      paymentMethod,
      paymentDate,
      paymentConfirmedByUserId,
    });
  }

  ['/agendamentos', '/painel', '/appointments', '/dashboard'].forEach((path) => revalidatePath(path));
});
