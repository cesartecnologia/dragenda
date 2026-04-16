'use client';

import 'dayjs/locale/pt-br';

import dayjs from 'dayjs';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
      color: '#1d4ed8',
    },
    revenue: {
      label: 'Faturamento',
      color: '#0f766e',
    },
  } satisfies ChartConfig;

  return (
    <Card className="rounded-[1.85rem] border border-slate-200/80 bg-white shadow-[0_20px_38px_-30px_rgba(15,23,42,0.24)]">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Painel analítico</p>
          <CardTitle className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Movimento do período</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Acompanhe o ritmo dos agendamentos e do faturamento dia a dia.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" />
            Agendamentos
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />
            Faturamento
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="date" tickLine={false} tickMargin={12} axisLine={false} minTickGap={18} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
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
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="appointments"
              stroke="var(--color-appointments)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AppointmentsChart;
