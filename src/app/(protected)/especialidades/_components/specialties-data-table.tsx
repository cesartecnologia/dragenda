'use client';

import { DataTable } from '@/components/ui/data-table';
import { specialtiesTable, type UserRole } from '@/db/schema';

import { getSpecialtiesTableColumns } from './table-columns';

type Specialty = typeof specialtiesTable.$inferSelect;

export default function SpecialtiesDataTable({ data, role }: { data: Specialty[]; role?: UserRole | null }) {
  return <DataTable data={data} columns={getSpecialtiesTableColumns(role)} />;
}
