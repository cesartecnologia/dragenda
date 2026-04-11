'use client';

import type { ReactNode } from 'react';

import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { appointmentsTable, doctorsTable, patientsTable } from '@/db/schema';
import { formatCurrencyInCents } from '@/helpers/currency';
import { formatDateTimeBr } from '@/helpers/time';

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

export const getAppointmentsTableColumns = (params: {
  renderActions: (appointment: AppointmentWithRelations) => ReactNode;
}): ColumnDef<AppointmentWithRelations>[] => [
  { id: 'patient', accessorKey: 'patient.name', header: 'Paciente' },
  { id: 'date', accessorKey: 'date', header: 'Data', cell: ({ row }) => formatDateTimeBr(row.original.date) },
  { id: 'doctor', accessorKey: 'doctor.name', header: 'Médico' },
  { id: 'specialty', accessorKey: 'doctor.specialty', header: 'Especialidade' },
  { id: 'price', accessorKey: 'appointmentPriceInCents', header: 'Valor', cell: ({ row }) => formatCurrencyInCents(row.original.appointmentPriceInCents) },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => row.original.status === 'cancelled'
      ? <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Cancelado</Badge>
      : row.original.status === 'completed'
        ? <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Consulta concluída</Badge>
        : <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Agendado</Badge>,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
        {params.renderActions(row.original)}
      </div>
    ),
  },
];
