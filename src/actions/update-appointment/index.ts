'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import dayjs from 'dayjs';

import { auth } from '@/lib/auth';
import { isAdminRole } from '@/lib/access';
import { actionClient } from '@/lib/next-safe-action';
import { confirmAppointmentPayment, getAppointmentById, setAppointmentStatus } from '@/server/clinic-data';

const paymentMethodSchema = z.enum(['cash', 'pix', 'card', 'insurance', 'other']);

const revalidateAppointments = () => ['/agendamentos', '/painel', '/appointments', '/dashboard'].forEach((path) => revalidatePath(path));

export const updateAppointmentPayment = actionClient
  .schema(z.object({ appointmentId: z.string().uuid(), paymentMethod: paymentMethodSchema.default('pix') }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession();
    if (!session?.user) throw new Error('Unauthorized');

    const appointment = await getAppointmentById(parsedInput.appointmentId);
    if (!appointment || appointment.clinicId !== session.user.clinic?.id) throw new Error('Appointment not found');

    await confirmAppointmentPayment({
      appointmentId: parsedInput.appointmentId,
      confirmedByUserId: session.user.id,
      paymentMethod: parsedInput.paymentMethod,
    });

    revalidateAppointments();
  });

export const changeAppointmentStatus = actionClient
  .schema(z.object({ appointmentId: z.string().uuid(), status: z.enum(['scheduled', 'completed', 'cancelled']) }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession();
    if (!session?.user) throw new Error('Unauthorized');

    const appointment = await getAppointmentById(parsedInput.appointmentId);
    if (!appointment || appointment.clinicId !== session.user.clinic?.id) throw new Error('Appointment not found');

    const isAdmin = isAdminRole(session.user.role);

    if (parsedInput.status === 'completed' && dayjs(appointment.date).isAfter(dayjs())) {
      throw new Error('A consulta só pode ser concluída no horário agendado ou depois dele.');
    }

    if (parsedInput.status === 'scheduled' && ['completed', 'cancelled'].includes(appointment.status) && !isAdmin) {
      throw new Error('Somente administradores podem reabrir este agendamento.');
    }

    await setAppointmentStatus({
      appointmentId: parsedInput.appointmentId,
      status: parsedInput.status,
      userId: session.user.id,
    });

    revalidateAppointments();
  });
