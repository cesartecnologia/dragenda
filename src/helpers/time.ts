import dayjs from 'dayjs';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const SLOT_INTERVAL_MINUTES = 30;
const LAST_TIME_SLOT_MINUTES = 23 * 60 + 30;

export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 5; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
  }
  return slots;
};

export const formatDateTimeBr = (date: Date | string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: BRAZIL_TIMEZONE,
  }).format(new Date(date));

export const formatDateBr = (date: Date | string) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: BRAZIL_TIMEZONE,
  }).format(new Date(date));

export const combineDateAndTime = (date: Date, time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return dayjs(date).hour(hour).minute(minute).second(0).millisecond(0).toDate();
};

export const getMinimumBookableTimeForDate = (date: Date | string) => {
  const selectedDate = dayjs(date);
  const now = dayjs();

  if (!selectedDate.isSame(now, 'day')) {
    return null;
  }

  const nowMinutes = now.hour() * 60 + now.minute();
  const nextSlotMinutes = Math.floor(nowMinutes / SLOT_INTERVAL_MINUTES + 1) * SLOT_INTERVAL_MINUTES;

  if (nextSlotMinutes > LAST_TIME_SLOT_MINUTES) {
    return null;
  }

  const hour = Math.floor(nextSlotMinutes / 60);
  const minute = nextSlotMinutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
};

export const isPastDate = (date: Date | string) => dayjs(date).isBefore(dayjs(), 'day');

export const isPastDateTime = (date: Date | string, time?: string) => {
  const base = dayjs(date);
  const dateTime = time
    ? base
      .hour(Number(time.split(':')[0]))
      .minute(Number(time.split(':')[1]))
      .second(0)
      .millisecond(0)
    : base;

  return !dateTime.isAfter(dayjs());
};
