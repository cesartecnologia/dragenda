'use client';

import { useState } from 'react';

import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { deletePatient } from '@/actions/delete-patient';
import { type UserRole, patientsTable } from '@/db/schema';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog } from '@/components/ui/dialog';

import PatientCard from './patient-card';
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

  if (!data.length) return null;

  const gridClassName = data.length <= 1
    ? 'grid-cols-1'
    : data.length === 2
      ? 'grid-cols-1 xl:grid-cols-2'
      : data.length === 3
        ? 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3'
        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';

  return (
    <>
      <div className={`grid justify-items-start gap-4 ${gridClassName}`}>
        {data.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            role={role}
            onEdit={setEditingPatient}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

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
