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
  appointments: '#9a7b44',
  revenue: '#2f6a49',
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
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b border-[#eadfcd] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-xl text-[#3f352b]">Movimento do período</CardTitle>
          <div className="text-sm text-[#7f725f]">Veja a agenda e o faturamento ao longo do mês.</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#7f725f]">
          <span className="flex items-center gap-2 rounded-full border border-[#d9c9ad] bg-[#fffdf7] px-3 py-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: chartColors.revenue }} />
            Faturamento
          </span>
          <span className="flex items-center gap-2 rounded-full border border-[#d9c9ad] bg-[#fffdf7] px-3 py-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: chartColors.appointments }} />
            Agendamentos
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-5 md:px-6">
        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eadfcd" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fill: '#8a7b65', fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                allowDecimals={false}
                tick={{ fill: '#8a7b65', fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={(value) => formatCurrencyInCents(value)}
                tick={{ fill: '#8a7b65', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '18px',
                  border: '1px solid rgba(217,201,173,0.95)',
                  boxShadow: '0 16px 30px rgba(90,67,36,0.18)',
                  backgroundColor: 'rgba(255,252,245,0.99)',
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


