'use client';

import { ColumnDef } from '@tanstack/react-table';

import { specialtiesTable, type UserRole } from '@/db/schema';

import SpecialtyTableActions from './table-actions';

type Specialty = typeof specialtiesTable.$inferSelect;

export const getSpecialtiesTableColumns = (role?: UserRole | null): ColumnDef<Specialty>[] => [
  { id: 'name', accessorKey: 'name', header: 'Especialidade' },
  { id: 'updatedAt', header: 'Atualizado em', cell: ({ row }) => new Intl.DateTimeFormat('pt-BR').format(new Date(row.original.updatedAt)) },
  { id: 'actions', cell: ({ row }) => <SpecialtyTableActions specialty={row.original} role={role} /> },
];
