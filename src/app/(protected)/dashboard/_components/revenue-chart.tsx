'use client';

import 'dayjs/locale/pt-br';

import dayjs from 'dayjs';
import { ActivitySquare } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

dayjs.locale('pt-br');

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCurrencyInCents } from '@/helpers/currency';

interface DailyAppointment {
  date: string;
  appointments: number;
  revenue: number | null;
}

interface AppointmentsChartProps {
  dailyAppointmentsData: DailyAppointment[];
}

const AppointmentsChart = ({ dailyAppointmentsData }: AppointmentsChartProps) => {
  const chartData = dailyAppointmentsData.map((item) => ({
    date: dayjs(item.date).format('DD/MM'),
    fullDate: item.date,
    appointments: item.appointments || 0,
    revenue: Number(item.revenue || 0),
  }));

  const chartConfig = {
    appointments: {
      label: 'Agendamentos',
      color: '#334155',
    },
    revenue: {
      label: 'Faturamento',
      color: '#0f766e',
    },
  } satisfies ChartConfig;

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
          <ActivitySquare className="size-4" />
        </div>
        <div>
          <CardTitle className="text-base text-slate-900">Movimento do período</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Atendimentos e faturamento dia a dia.</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} minTickGap={18} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrencyInCents(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === 'revenue') {
                      return (
                        <>
                          <div className="h-3 w-3 rounded bg-[var(--color-revenue)]" />
                          <span className="text-muted-foreground">Faturamento:</span>
                          <span className="font-semibold">{formatCurrencyInCents(Number(value))}</span>
                        </>
                      );
                    }
                    return (
                      <>
                        <div className="h-3 w-3 rounded bg-[var(--color-appointments)]" />
                        <span className="text-muted-foreground">Agendamentos:</span>
                        <span className="font-semibold">{value}</span>
                      </>
                    );
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return dayjs(payload[0].payload?.fullDate).format('DD/MM/YYYY');
                    }
                    return label;
                  }}
                />
              }
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="appointments"
              stroke="var(--color-appointments)"
              fill="var(--color-appointments)"
              fillOpacity={0.12}
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="var(--color-revenue)"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AppointmentsChart;
