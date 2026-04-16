import { CalendarCheck2, CircleDollarSign, Clock3, Stethoscope, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { appointmentsTable, doctorsTable, patientsTable } from '@/db/schema';
import { formatCurrencyInCents } from '@/helpers/currency';
import { formatDateTimeBr } from '@/helpers/time';

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

const statusLabel: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function TodayAppointmentsList({ appointments }: { appointments: AppointmentWithRelations[] }) {
  if (!appointments.length) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/75 px-6 text-center">
        <div className="mb-3 rounded-full border border-slate-200 bg-white p-3 shadow-sm">
          <CalendarCheck2 className="size-5 text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Nenhum atendimento para hoje</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Assim que novos horários forem marcados, eles aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="rounded-[1.4rem] border border-slate-100 bg-slate-50/75 px-4 py-4 transition-colors hover:border-slate-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">{appointment.patient.name}</p>
                <Badge variant="secondary" className="rounded-full bg-white text-slate-700 hover:bg-white">
                  {statusLabel[appointment.status] ?? 'Agendado'}
                </Badge>
                {appointment.paymentConfirmed ? (
                  <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Pago</Badge>
                ) : (
                  <Badge className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">Pendente</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-4" />
                  {formatDateTimeBr(appointment.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-4" />
                  {appointment.patient.phoneNumber}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Stethoscope className="size-4" />
                  {appointment.doctor.name}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <CircleDollarSign className="size-4 text-slate-500" />
              {formatCurrencyInCents(appointment.appointmentPriceInCents)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
