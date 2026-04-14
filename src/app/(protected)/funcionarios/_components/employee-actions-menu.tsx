'use client';

import { MoreHorizontal, Pencil, RefreshCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { deleteEmployee } from '@/actions/delete-employee';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { employeesTable } from '@/db/schema';

import EmployeeForm from './employee-form';
import { EmployeePasswordDialog } from './employee-password-dialog';

export function EmployeeActionsMenu({ employee }: { employee: typeof employeesTable.$inferSelect }) {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteAction = useAction(deleteEmployee, {
    onSuccess: () => {
      toast.success('Usuário excluído com sucesso.');
      setDeleteOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível excluir o usuário.'),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setEditOpen(true); }}>
            <Pencil className="h-4 w-4" />Editar usuário
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(event) => { event.preventDefault(); setPasswordOpen(true); }}>
            <RefreshCcw className="h-4 w-4" />Alterar senha
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => { event.preventDefault(); setDeleteOpen(true); }}
          >
            <Trash2 className="h-4 w-4" />Excluir usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EmployeeForm employee={employee} open={editOpen} onOpenChange={setEditOpen} hideDefaultTrigger />
      <EmployeePasswordDialog employee={employee} open={passwordOpen} onOpenChange={setPasswordOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove {employee.name} da clínica e exclui os dados do usuário no Firestore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={() => deleteAction.execute({ id: employee.id })}>
              Excluir usuário
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
