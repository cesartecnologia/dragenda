import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { doctorsTable } from "@/db/schema";

dayjs.extend(utc);
dayjs.locale("pt-br");

const parseTime = (value: string | null | undefined) => {
  const [hour = "8", minute = "0", second = "0"] = (value ?? "08:00:00").split(":");

  return {
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second || 0),
  };
};

export const getAvailability = (doctor: typeof doctorsTable.$inferSelect) => {
  const firstRange = doctor.availabilityRanges?.[0];
  const fromWeekDay = doctor.availableFromWeekDay ?? dayjs().day();
  const toWeekDay = doctor.availableToWeekDay ?? fromWeekDay;
  const fromTime = parseTime(firstRange?.fromTime ?? doctor.availableFromTime);
  const toTime = parseTime(firstRange?.toTime ?? doctor.availableToTime);

  const from = dayjs()
    .utc()
    .day(fromWeekDay)
    .set("hour", fromTime.hour)
    .set("minute", fromTime.minute)
    .set("second", fromTime.second)
    .local();

  const to = dayjs()
    .utc()
    .day(toWeekDay)
    .set("hour", toTime.hour)
    .set("minute", toTime.minute)
    .set("second", toTime.second)
    .local();

  return { from, to };
};
