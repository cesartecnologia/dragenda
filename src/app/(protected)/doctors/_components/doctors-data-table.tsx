'use client';

import { type UserRole, doctorsTable } from '@/db/schema';
import { DataTable } from '@/components/ui/data-table';
import { getDoctorsTableColumns } from './table-columns';

type Doctor = typeof doctorsTable.$inferSelect;

export default function DoctorsDataTable({
  data,
  role,
  specialties = [],
}: {
  data: Doctor[];
  role?: UserRole | null;
  specialties?: string[];
}) {
  return <DataTable data={data} columns={getDoctorsTableColumns(role, specialties)} />;
}
