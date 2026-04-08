'use client';

import { ColumnDef } from '@tanstack/react-table';
import { EditIcon, MoreHorizontal, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { patientsTable, type UserRole } from '@/db/schema';
import { formatPhoneNumber } from '@/helpers/format';
import { canDeleteRecords } from '@/lib/access';

type Patient = typeof patientsTable.$inferSelect;

export const getPatientsTableColumns = (params: {
  role?: UserRole | null;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}): ColumnDef<Patient>[] => [
  { id: 'name', accessorKey: 'name', header: 'Nome' },
  {
    id: 'phoneNumber',
    accessorKey: 'phoneNumber',
    header: 'Telefone',
    cell: ({ row }) => formatPhoneNumber(row.original.phoneNumber),
  },
  {
    id: 'address',
    accessorKey: 'address',
    header: 'Endereço',
    cell: ({ row }) => row.original.address || '—',
  },
  {
    id: 'actions',
    header: () => <div className="flex justify-end pr-1">Ações</div>,
    cell: ({ row }) => {
      const patient = row.original;
      return (
        <div className="flex justify-end pr-1" onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(event) => event.preventDefault()}>
              <DropdownMenuLabel className="truncate">{patient.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  params.onEdit(patient);
                }}
              >
                <EditIcon className="mr-2 size-4" />
                Editar paciente
              </DropdownMenuItem>
              {canDeleteRecords(params.role) ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    params.onDelete(patient);
                  }}
                  className="text-red-600 focus:text-red-700"
                >
                  <TrashIcon className="mr-2 size-4" />
                  Excluir paciente
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
