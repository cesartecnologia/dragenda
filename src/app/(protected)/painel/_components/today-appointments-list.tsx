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
      <div className="rounded-[22px] border border-dashed border-slate-200 bg-[#f7f9ff] px-4 py-6 text-center text-sm text-slate-500">
        Nenhum agendamento para hoje.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment, index) => (
        <div
          key={appointment.id}
          className="animate-panel-fade-up rounded-[22px] border border-slate-100 bg-white p-4 text-sm shadow-[0_10px_24px_rgba(125,160,220,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(125,160,220,0.14)]"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate text-slate-900">{appointment.patient.name}</strong>
                <Badge variant="secondary" className="rounded-full bg-[#eef4ff] text-slate-700">
                  {statusLabel[appointment.status] ?? 'Agendado'}
                </Badge>
                {appointment.paymentConfirmed ? <Badge className="rounded-full bg-primary/15 text-primary hover:bg-primary/15">Pago</Badge> : null}
              </div>
              <p className="truncate text-slate-500">
                {formatDateTimeBr(appointment.date)} • {appointment.doctor.name} • {appointment.doctor.specialty}
              </p>
            </div>

            <div className="rounded-full bg-[#f5f8ff] px-3 py-2 text-sm font-semibold text-slate-700">
              {formatCurrencyInCents(appointment.appointmentPriceInCents)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
