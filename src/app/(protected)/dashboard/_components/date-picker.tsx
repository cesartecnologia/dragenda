'use client';

import { endOfMonth, format, setMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseAsIsoDate, useQueryStates } from 'nuqs';
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
  const [filters, setFilters] = useQueryStates(
    {
      from: parseAsIsoDate.withDefault(startOfMonth(new Date())),
      to: parseAsIsoDate.withDefault(endOfMonth(new Date())),
    },
    {
      shallow: false,
    }
  );

  const [selectedMonthDate, setSelectedMonthDate] = React.useState(filters.from);
  const [displayYear, setDisplayYear] = React.useState(filters.from.getFullYear());

  React.useEffect(() => {
    setSelectedMonthDate(filters.from);
    setDisplayYear(filters.from.getFullYear());
  }, [filters.from]);

  const handleMonthSelect = (monthIndex: number) => {
    const selectedDate = startOfMonth(
      setMonth(new Date(displayYear, 0, 1), monthIndex)
    );

    setSelectedMonthDate(selectedDate);
    setFilters({
      from: selectedDate,
      to: endOfMonth(selectedDate),
    });
  };

  const currentMonthLabel = capitalize(
    format(selectedMonthDate, 'MMMM', {
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
                  selectedMonthDate.getFullYear() === displayYear &&
                  selectedMonthDate.getMonth() === monthIndex;

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
