'use client';

import { useMemo, useState } from 'react';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { appointmentsTable, doctorsTable, patientsTable } from '@/db/schema';
import { formatTimeBr, toBrazilTime } from '@/helpers/time';
import { cn } from '@/lib/utils';

dayjs.locale('pt-br');

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: Pick<typeof patientsTable.$inferSelect, 'id' | 'name'>;
  doctor: Pick<typeof doctorsTable.$inferSelect, 'id' | 'name' | 'specialty'>;
};

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_INTERVAL_MINUTES = 30;
const SLOT_HEIGHT_PX = 44;
const DEFAULT_EVENT_DURATION_SLOTS = 2;
const GRID_TOP_OFFSET_PX = 10;

const getWeekStart = (date: dayjs.Dayjs) => {
  const day = date.day();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return date.startOf('day').add(diffToMonday, 'day');
};

const getEventTone = (status: AppointmentWithRelations['status']) => {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  }

  if (status === 'cancelled') {
    return 'border-rose-200 bg-rose-50 text-rose-900';
  }

  return 'border-blue-200 bg-blue-50 text-blue-900';
};

export default function AppointmentsCalendarView({
  appointments,
  initialDate,
}: {
  appointments: AppointmentWithRelations[];
  initialDate?: string;
}) {
  const initialReferenceDate = useMemo(() => {
    if (initialDate) {
      return toBrazilTime(initialDate);
    }

    return toBrazilTime();
  }, [initialDate]);

  const [weekStart, setWeekStart] = useState(() => getWeekStart(initialReferenceDate));

  const slots = useMemo(() => {
    const values: Array<{ minutes: number; isFullHour: boolean }> = [];

    for (let minutes = START_HOUR * 60; minutes <= END_HOUR * 60; minutes += SLOT_INTERVAL_MINUTES) {
      values.push({
        minutes,
        isFullHour: minutes % 60 === 0,
      });
    }

    return values;
  }, []);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => weekStart.add(index, 'day')),
    [weekStart],
  );

  const weekEnd = useMemo(() => weekStart.add(6, 'day').endOf('day'), [weekStart]);

  const timelineHeight = GRID_TOP_OFFSET_PX + (slots.length - 1) * SLOT_HEIGHT_PX;

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>();
    days.forEach((day) => map.set(day.format('YYYY-MM-DD'), []));

    appointments.forEach((appointment) => {
      const appointmentDate = toBrazilTime(appointment.date);
      if (appointmentDate.isBefore(weekStart) || appointmentDate.isAfter(weekEnd)) {
        return;
      }

      const dayKey = appointmentDate.format('YYYY-MM-DD');
      const collection = map.get(dayKey);
      if (collection) {
        collection.push(appointment);
      }
    });

    map.forEach((dayAppointments) => {
      dayAppointments.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
    });

    return map;
  }, [appointments, days, weekEnd, weekStart]);

  const hasAppointmentsInWeek = Array.from(appointmentsByDay.values()).some((dayAppointments) => dayAppointments.length > 0);

  const weekLabel = `${weekStart.format('D [de] MMMM')} - ${weekEnd.format('D [de] MMMM [de] YYYY')}`;

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Calendario semanal</h3>
          <p className="text-sm text-slate-500">{weekLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => setWeekStart((current) => current.subtract(7, 'day'))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="outline" className="rounded-xl px-4" onClick={() => setWeekStart(getWeekStart(toBrazilTime()))}>
            Hoje
          </Button>
          <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => setWeekStart((current) => current.add(7, 'day'))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="max-h-[760px] overflow-y-auto [scrollbar-gutter:stable]">
            <div className="sticky top-0 z-10 grid border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm" style={{ gridTemplateColumns: '76px repeat(7, minmax(0, 1fr))' }}>
              <div className="border-r border-slate-200 px-2 py-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Hora</div>
              {days.map((day) => {
                const isToday = day.isSame(toBrazilTime(), 'day');
                return (
                  <div key={day.format('YYYY-MM-DD')} className="border-r border-slate-200 px-3 py-3 text-center last:border-r-0">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{day.format('ddd')}</p>
                    <p className={cn('mt-1 text-sm font-semibold text-slate-700', isToday && 'text-primary')}>{day.format('DD/MM')}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid" style={{ gridTemplateColumns: '76px repeat(7, minmax(0, 1fr))' }}>
              <div className="relative border-r border-slate-200 bg-slate-50/50" style={{ height: `${timelineHeight}px` }}>
                {slots.map((slot, index) => (
                  <div
                    key={slot.minutes}
                    className="absolute inset-x-0 border-t border-slate-100"
                    style={{ top: `${GRID_TOP_OFFSET_PX + index * SLOT_HEIGHT_PX}px` }}
                  >
                    {slot.isFullHour ? (
                      <span className="absolute left-2 top-0 -translate-y-1/2 bg-slate-50 px-1 text-[11px] font-medium text-slate-500">
                        {`${Math.floor(slot.minutes / 60).toString().padStart(2, '0')}:00`}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              {days.map((day) => {
                const dayKey = day.format('YYYY-MM-DD');
                const dayAppointments = appointmentsByDay.get(dayKey) ?? [];
                const daySlotCount = new Map<number, number>();

                return (
                  <div key={dayKey} className="relative border-r border-slate-200 last:border-r-0" style={{ height: `${timelineHeight}px` }}>
                    {slots.map((slot, index) => (
                      <div
                        key={`${dayKey}-${slot.minutes}`}
                        className="absolute inset-x-0 border-t border-slate-100"
                        style={{ top: `${GRID_TOP_OFFSET_PX + index * SLOT_HEIGHT_PX}px` }}
                      />
                    ))}

                    {dayAppointments.map((appointment) => {
                      const appointmentDate = toBrazilTime(appointment.date);
                      const minutesInDay = appointmentDate.hour() * 60 + appointmentDate.minute();
                      const minutesFromStart = minutesInDay - START_HOUR * 60;

                      if (minutesFromStart < 0 || minutesFromStart >= (END_HOUR - START_HOUR) * 60) {
                        return null;
                      }

                      const top = GRID_TOP_OFFSET_PX + (minutesFromStart / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX + 4;
                      const startSlot = Math.floor(minutesFromStart / SLOT_INTERVAL_MINUTES);
                      const overlapIndex = daySlotCount.get(startSlot) ?? 0;
                      daySlotCount.set(startSlot, overlapIndex + 1);
                      const leftOffset = 8 + overlapIndex * 10;
                      const baseHeight = SLOT_HEIGHT_PX * DEFAULT_EVENT_DURATION_SLOTS - 8;
                      const maxAvailableHeight = Math.max(SLOT_HEIGHT_PX - 8, timelineHeight - top - 6);
                      const eventHeight = Math.min(baseHeight, maxAvailableHeight);

                      return (
                        <Link
                          key={appointment.id}
                          href={`/agendamentos/${appointment.id}`}
                          className={cn(
                            'absolute right-2 rounded-xl border px-2.5 py-2 text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                            getEventTone(appointment.status),
                          )}
                          style={{
                            top: `${top}px`,
                            left: `${leftOffset}px`,
                            height: `${eventHeight}px`,
                          }}
                        >
                          <p className="truncate font-semibold">{appointment.patient.name}</p>
                          <p className="mt-0.5 truncate text-[11px] opacity-90">{appointment.doctor.name}</p>
                          <p className="mt-1 text-[11px] font-medium">{formatTimeBr(appointment.date)}</p>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {!hasAppointmentsInWeek ? (
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          Nenhum agendamento nesta semana.
        </div>
      ) : null}
    </div>
  );
}
