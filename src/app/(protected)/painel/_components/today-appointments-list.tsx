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
    return <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>;
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="rounded-lg border p-3 text-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate">{appointment.patient.name}</strong>
                <Badge variant="secondary">{statusLabel[appointment.status] ?? 'Agendado'}</Badge>
                {appointment.paymentConfirmed ? <Badge>Pago</Badge> : null}
              </div>
              <p className="text-muted-foreground">
                {formatDateTimeBr(appointment.date)} • {appointment.doctor.name} • {appointment.doctor.specialty}
              </p>
              {appointment.patient.phoneNumber ? (
                <p className="text-muted-foreground">Telefone: {appointment.patient.phoneNumber}</p>
              ) : null}
            </div>

            <div className="font-medium">
              {formatCurrencyInCents(appointment.appointmentPriceInCents)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
