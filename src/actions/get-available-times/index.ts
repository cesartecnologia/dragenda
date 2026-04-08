'use server';

import dayjs from 'dayjs';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { generateTimeSlots, getMinimumBookableTimeForDate, isPastDate } from '@/helpers/time';
import { actionClient } from '@/lib/next-safe-action';
import { getDoctorById, listAppointmentsByDoctorId } from '@/server/clinic-data';

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      doctorId: z.string(),
      date: z.string().date(),
      appointmentId: z.string().uuid().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession();
    if (!session?.user) throw new Error('Unauthorized');
    if (!session.user.clinic?.id) throw new Error('Clinic not found');

    const doctor = await getDoctorById(parsedInput.doctorId);
    if (!doctor || doctor.clinicId !== session.user.clinic.id) throw new Error('Doctor not found');

    const selectedDate = dayjs(parsedInput.date);
    if (isPastDate(selectedDate.toDate())) return [];

    const matchingRange = (doctor.availabilityRanges ?? []).find((range) => {
      const start = dayjs(range.startDate).startOf('day');
      const end = dayjs(range.endDate).endOf('day');
      return selectedDate.isAfter(start.subtract(1, 'millisecond')) && selectedDate.isBefore(end.add(1, 'millisecond'));
    });

    const fallbackAllowed =
      doctor.availableFromWeekDay !== null &&
      doctor.availableToWeekDay !== null &&
      selectedDate.day() >= doctor.availableFromWeekDay &&
      selectedDate.day() <= doctor.availableToWeekDay;

    const fromTime = matchingRange?.fromTime ?? doctor.availableFromTime;
    const toTime = matchingRange?.toTime ?? doctor.availableToTime;

    if ((!matchingRange && !fallbackAllowed) || !fromTime || !toTime) return [];

    const appointments = await listAppointmentsByDoctorId(parsedInput.doctorId);
    const appointmentsOnSelectedDate = appointments
      .filter(
        (appointment) =>
          appointment.id !== parsedInput.appointmentId &&
          appointment.status !== 'cancelled' &&
          dayjs(appointment.date).isSame(parsedInput.date, 'day'),
      )
      .map((appointment) => dayjs(appointment.date).format('HH:mm:ss'));

    const minimumBookableTime = getMinimumBookableTimeForDate(selectedDate.toDate());
    const timeSlots = generateTimeSlots();
    const doctorTimeSlots = timeSlots.filter((time) => {
      const withinDoctorRange = time >= fromTime && time <= toTime;
      const notPastTime = minimumBookableTime ? time >= minimumBookableTime : true;
      return withinDoctorRange && notPastTime;
    });

    return doctorTimeSlots.map((time) => ({
      value: time,
      available: !appointmentsOnSelectedDate.includes(time),
      label: time.substring(0, 5),
    }));
  });
