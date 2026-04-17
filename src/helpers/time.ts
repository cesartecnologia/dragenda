import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const SLOT_INTERVAL_MINUTES = 30;
const LAST_TIME_SLOT_MINUTES = 23 * 60 + 30;

const normalizeTimeString = (value: string) => (value.length === 5 ? `${value}:00` : value);

export const toBrazilTime = (date?: Date | string | null) =>
  date ? dayjs(date).tz(BRAZIL_TIMEZONE) : dayjs().tz(BRAZIL_TIMEZONE);

export const parseBrazilDate = (date: string) => dayjs.tz(date, 'YYYY-MM-DD', BRAZIL_TIMEZONE);

export const startOfBrazilDay = (date: Date | string = new Date()) => toBrazilTime(date).startOf('day').toDate();

export const endOfBrazilDay = (date: Date | string = new Date()) => toBrazilTime(date).endOf('day').toDate();

export const getBrazilDateKey = (date: Date | string) =>
  (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? parseBrazilDate(date)
    : toBrazilTime(date)).format('YYYY-MM-DD');

export const getBrazilTimeKey = (date: Date | string) => toBrazilTime(date).format('HH:mm:ss');

export const getBrazilMonthStartKey = (date: Date | string = new Date()) => toBrazilTime(date).startOf('month').format('YYYY-MM-DD');

export const getBrazilMonthEndKey = (date: Date | string = new Date()) => toBrazilTime(date).endOf('month').format('YYYY-MM-DD');

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

export const formatTimeBr = (date: Date | string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeStyle: 'short',
    timeZone: BRAZIL_TIMEZONE,
  }).format(new Date(date));

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

export const combineDateAndTime = (date: Date | string, time: string) => {
  const dateKey = getBrazilDateKey(date);
  return dayjs.tz(`${dateKey} ${normalizeTimeString(time)}`, 'YYYY-MM-DD HH:mm:ss', BRAZIL_TIMEZONE).toDate();
};

export const getMinimumBookableTimeForDate = (date: Date | string) => {
  const selectedDate = toBrazilTime(date);
  const now = toBrazilTime();

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

export const isPastDate = (date: Date | string) => toBrazilTime(date).isBefore(toBrazilTime(), 'day');

export const isPastDateTime = (date: Date | string, time?: string) => {
  const dateTime = time ? toBrazilTime(combineDateAndTime(date, time)) : toBrazilTime(date);
  return !dateTime.isAfter(toBrazilTime());
};

export const isSameBrazilDay = (left: Date | string, right: Date | string) => getBrazilDateKey(left) === getBrazilDateKey(right);
