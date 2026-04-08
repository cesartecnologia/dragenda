'use client';

import { useMemo, useState } from 'react';

import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { deletePatient } from '@/actions/delete-patient';
import { type UserRole, patientsTable } from '@/db/schema';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';

import { getPatientsTableColumns } from './table-columns';
import UpsertPatientForm from './upsert-patient-form';

type Patient = typeof patientsTable.$inferSelect;

export default function PatientsDataTable({
  data,
  role,
}: {
  data: Patient[];
  role?: UserRole | null;
}) {
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success('Paciente excluído com sucesso.');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao excluir paciente.'),
  });

  const columns = useMemo(
    () =>
      getPatientsTableColumns({
        role,
        onEdit: setEditingPatient,
        onDelete: setDeleteTarget,
      }),
    [role],
  );

  return (
    <>
      <DataTable data={data} columns={columns} />

      <Dialog open={!!editingPatient} onOpenChange={(open) => !open && setEditingPatient(null)}>
        <UpsertPatientForm isOpen={!!editingPatient} patient={editingPatient ?? undefined} onSuccess={() => setEditingPatient(null)} />
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser revertida. O paciente e os agendamentos vinculados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deletePatientAction.execute({ id: deleteTarget.id })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
