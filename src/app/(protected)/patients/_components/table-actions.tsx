'use client';

import { EditIcon, TrashIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { deletePatient } from '@/actions/delete-patient';
import { canDeleteRecords } from '@/lib/access';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { patientsTable, type UserRole } from '@/db/schema';

import UpsertPatientForm from './upsert-patient-form';

interface PatientsTableActionsProps { patient: typeof patientsTable.$inferSelect; role?: UserRole | null; }

const PatientsTableActions = ({ patient, role }: PatientsTableActionsProps) => {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canDelete = canDeleteRecords(role);
  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success('Paciente excluído com sucesso.');
      setDeleteOpen(false);
    },
    onError: () => toast.error('Erro ao excluir paciente.'),
  });

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" className="rounded-full px-4" onClick={() => setUpsertDialogIsOpen(true)}>
          <EditIcon className="mr-2 size-4" />Editar
        </Button>
        {canDelete ? (
          <Button type="button" size="sm" variant="outline" className="rounded-full border-red-200 px-4 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteOpen(true)}>
            <TrashIcon className="mr-2 size-4" />Excluir
          </Button>
        ) : null}
      </div>

      <Dialog open={upsertDialogIsOpen} onOpenChange={setUpsertDialogIsOpen}>
        <UpsertPatientForm isOpen={upsertDialogIsOpen} patient={patient} onSuccess={() => setUpsertDialogIsOpen(false)} />
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser revertida. O paciente e os agendamentos vinculados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePatientAction.execute({ id: patient.id })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PatientsTableActions;
