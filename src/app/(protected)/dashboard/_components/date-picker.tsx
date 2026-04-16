'use client';

import { endOfMonth, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTH_NAMES = Array.from({ length: 12 }, (_, monthIndex) =>
  format(new Date(2026, monthIndex, 1), 'MMMM', { locale: ptBR }),
);

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const parseLocalDate = (value?: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toIsoDate = (value: Date) => format(value, 'yyyy-MM-dd');

export function DatePicker({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeMonthDate = React.useMemo(() => {
    const from = parseLocalDate(searchParams.get('from'));
    return from ? startOfMonth(from) : startOfMonth(new Date());
  }, [searchParams]);

  const [displayYear, setDisplayYear] = React.useState(activeMonthDate.getFullYear());

  React.useEffect(() => {
    setDisplayYear(activeMonthDate.getFullYear());
  }, [activeMonthDate]);

  const handleMonthSelect = (monthIndex: number) => {
    const selectedDate = startOfMonth(new Date(displayYear, monthIndex, 1));
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', toIsoDate(selectedDate));
    params.set('to', toIsoDate(endOfMonth(selectedDate)));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const currentMonthLabel = capitalize(format(activeMonthDate, 'MMMM', { locale: ptBR }));

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className="h-11 min-w-44 justify-start gap-2 rounded-2xl border-slate-200/80 bg-white/90 px-4 text-left font-medium text-slate-700 hover:bg-[#f7fbfa]"
          >
            <CalendarIcon className="size-4 text-primary" />
            <span>{currentMonthLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] rounded-[24px] border border-slate-200/80 bg-white/96 p-4 shadow-[0_24px_50px_rgba(15,23,42,0.12)]" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" size="icon" className="size-9 rounded-xl" onClick={() => setDisplayYear((current) => current - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-semibold text-slate-800">{displayYear}</span>
              <Button type="button" variant="ghost" size="icon" className="size-9 rounded-xl" onClick={() => setDisplayYear((current) => current + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((monthName, monthIndex) => {
                const isActive =
                  activeMonthDate.getFullYear() === displayYear &&
                  activeMonthDate.getMonth() === monthIndex;

                return (
                  <Button
                    key={monthName}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className={cn(
                      'h-10 justify-center rounded-xl px-2 text-sm',
                      !isActive && 'border-slate-200/80 bg-white text-slate-600 hover:bg-[#f7fbfa]',
                    )}
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
