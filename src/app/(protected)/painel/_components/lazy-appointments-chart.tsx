'use client';

import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyAppointment {
  date: string;
  appointments: number;
  revenue: number | null;
}

const AppointmentsChart = dynamic(() => import('../../dashboard/_components/revenue-chart'), {
  ssr: false,
  loading: () => <ChartCardSkeleton />,
});

function ChartCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full rounded-[24px]" />
      </CardContent>
    </Card>
  );
}

export default function LazyAppointmentsChart({ dailyAppointmentsData }: { dailyAppointmentsData: DailyAppointment[] }) {
  return <AppointmentsChart dailyAppointmentsData={dailyAppointmentsData} />;
}
