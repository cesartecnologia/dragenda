'use client';

import { EditIcon, MoreVerticalIcon, TrashIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteSpecialty } from '@/actions/delete-specialty';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { specialtiesTable, type UserRole } from '@/db/schema';
import { canDeleteRecords } from '@/lib/access';

import SpecialtyForm from './specialty-form';

export default function SpecialtyTableActions({ specialty, role }: { specialty: typeof specialtiesTable.$inferSelect; role?: UserRole | null }) {
  const [open, setOpen] = useState(false);
  const canDelete = canDeleteRecords(role);
  const deleteAction = useAction(deleteSpecialty, {
    onSuccess: () => toast.success('Especialidade excluída.'),
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao excluir especialidade.'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon"><MoreVerticalIcon className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{specialty.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setOpen(true); }}><EditIcon className="mr-2 size-4" />Editar</DropdownMenuItem>
          {canDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}><TrashIcon className="mr-2 size-4" />Excluir</DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir especialidade?</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação remove a especialidade do cadastro da clínica.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAction.execute({ id: specialty.id })}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <SpecialtyForm specialty={specialty} onSuccess={() => setOpen(false)} />
    </Dialog>
  );
}
