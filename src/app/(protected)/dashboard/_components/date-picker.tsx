'use client';

import { endOfMonth, format, setMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseAsIsoDate, useQueryState } from 'nuqs';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTH_NAMES = Array.from({ length: 12 }, (_, monthIndex) =>
  format(new Date(2026, monthIndex, 1), 'MMMM', { locale: ptBR })
);

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export function DatePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [from, setFrom] = useQueryState(
    'from',
    parseAsIsoDate.withDefault(startOfMonth(new Date()))
  );
  const [, setTo] = useQueryState(
    'to',
    parseAsIsoDate.withDefault(endOfMonth(new Date()))
  );
  const [displayYear, setDisplayYear] = React.useState(from.getFullYear());

  React.useEffect(() => {
    setDisplayYear(from.getFullYear());
  }, [from]);

  const handleMonthSelect = (monthIndex: number) => {
    const selectedDate = setMonth(new Date(displayYear, 0, 1), monthIndex);
    setFrom(startOfMonth(selectedDate), {
      shallow: false,
    });
    setTo(endOfMonth(selectedDate), {
      shallow: false,
    });
  };

  const currentMonthLabel = capitalize(
    format(from, 'MMMM', {
      locale: ptBR,
    })
  );

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className="min-w-40 justify-start gap-2 text-left font-medium"
          >
            <CalendarIcon className="size-4" />
            <span>{currentMonthLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setDisplayYear((current) => current - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-semibold text-slate-700">
                {displayYear}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setDisplayYear((current) => current + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((monthName, monthIndex) => {
                const isActive =
                  from.getFullYear() === displayYear &&
                  from.getMonth() === monthIndex;

                return (
                  <Button
                    key={monthName}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className="h-9 justify-center rounded-md px-2 text-sm"
                    onClick={() => handleMonthSelect(monthIndex)}
                  >
                    {capitalize(monthName.slice(0, 3))}
                  </Button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
