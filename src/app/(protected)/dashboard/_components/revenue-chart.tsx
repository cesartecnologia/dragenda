'use client';

import 'dayjs/locale/pt-br';

import dayjs from 'dayjs';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

dayjs.locale('pt-br');

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyInCents } from '@/helpers/currency';

interface DailyAppointment {
  date: string;
  appointments: number;
  revenue: number | null;
}

interface AppointmentsChartProps {
  dailyAppointmentsData: DailyAppointment[];
}

const chartColors = {
  appointments: '#6e85ca',
  revenue: '#8cb7ff',
};

export default function AppointmentsChart({ dailyAppointmentsData }: AppointmentsChartProps) {
  const chartData = [...dailyAppointmentsData]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      label: dayjs(item.date).format('DD/MM'),
      fullDate: item.date,
      appointments: item.appointments,
      revenue: Number(item.revenue ?? 0),
    }));

  return (
    <Card className="animate-panel-fade-up overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-xl text-slate-900">Movimento do período</CardTitle>
          <div className="text-sm text-slate-500">Veja a agenda e o faturamento ao longo do mês.</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: chartColors.revenue }} />
            Faturamento
          </span>
          <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: chartColors.appointments }} />
            Agendamentos
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-5 md:px-6">
        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#edf2fb" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fill: '#8693ab', fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                allowDecimals={false}
                tick={{ fill: '#8693ab', fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={(value) => formatCurrencyInCents(value)}
                tick={{ fill: '#8693ab', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '18px',
                  border: '1px solid rgba(226,232,240,0.95)',
                  boxShadow: '0 16px 30px rgba(125,160,220,0.16)',
                  backgroundColor: 'rgba(255,255,255,0.98)',
                }}
                formatter={(value, name) => {
                  if (name === 'revenue') {
                    return [formatCurrencyInCents(Number(value)), 'Faturamento'];
                  }
                  return [value, 'Agendamentos'];
                }}
                labelFormatter={(label, payload) => {
                  if (payload?.[0]?.payload?.fullDate) {
                    return dayjs(payload[0].payload.fullDate).format('DD/MM/YYYY');
                  }
                  return label;
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke={chartColors.revenue}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: chartColors.revenue }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="appointments"
                stroke={chartColors.appointments}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: chartColors.appointments }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
