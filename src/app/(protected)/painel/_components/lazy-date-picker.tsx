'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

const DatePicker = dynamic(() => import('../../dashboard/_components/date-picker').then((mod) => mod.DatePicker), {
  ssr: false,
  loading: () => <Skeleton className="h-11 min-w-44 rounded-2xl" />,
});

export default function LazyDatePicker() {
  return <DatePicker />;
}
