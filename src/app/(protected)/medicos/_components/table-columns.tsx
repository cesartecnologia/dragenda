'use client';

import { ColumnDef } from '@tanstack/react-table';

import { doctorsTable, type UserRole } from '@/db/schema';
import { formatCurrencyInCents } from '@/helpers/currency';

import DoctorsTableActions from './table-actions';

type Doctor = typeof doctorsTable.$inferSelect;

export const getDoctorsTableColumns = (role?: UserRole | null, specialties: string[] = []): ColumnDef<Doctor>[] => [
  { id: 'name', accessorKey: 'name', header: 'Nome' },
  { id: 'crm', accessorKey: 'crm', header: 'CRM' },
  { id: 'specialty', accessorKey: 'specialty', header: 'Especialidade' },
  { id: 'appointmentPriceInCents', accessorKey: 'appointmentPriceInCents', header: 'Consulta', cell: ({ row }) => formatCurrencyInCents(row.original.appointmentPriceInCents) },
  { id: 'availability', header: 'Períodos', cell: ({ row }) => `${row.original.availabilityRanges?.length ?? 0} período(s)` },
  { id: 'actions', cell: ({ row }) => <DoctorsTableActions doctor={row.original} role={role} specialties={specialties} /> },
];

export const doctorsTableColumns = getDoctorsTableColumns('owner');
