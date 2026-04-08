'use client';

import { EditIcon, MessageCircle, Printer, Receipt, TrashIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteAppointment } from '@/actions/delete-appointment';
import { updateAppointmentPayment } from '@/actions/update-appointment';
import { canDeleteRecords, canManageFinancialActions } from '@/lib/access';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { openAppointmentPrintPopup } from '@/helpers/open-appointment-print-popup';
import { appointmentsTable, doctorsTable, patientsTable, type UserRole } from '@/db/schema';

import AddAppointmentForm from './add-appointment-form';

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

interface Props {
  appointment: AppointmentWithRelations;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  role?: UserRole | null;
}

const AppointmentsTableActions = ({ appointment, patients, doctors, role }: Props) => {
  const [upsertDialogIsOpen, setUpsertDialogIsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canDelete = canDeleteRecords(role);
  const canManageFinancial = canManageFinancialActions(role);

  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success('Agendamento excluído com sucesso.');
      setDeleteOpen(false);
    },
    onError: () => toast.error('Erro ao excluir agendamento.'),
  });
  const confirmPaymentAction = useAction(updateAppointmentPayment, {
    onSuccess: () => toast.success('Pagamento confirmado com sucesso.'),
    onError: () => toast.error('Erro ao confirmar pagamento.'),
  });

  const handleWhatsapp = () => {
    const phone = appointment.patient.phoneNumber.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá, ${appointment.patient.name}! 👋\n\n🧾 Seu comprovante de agendamento está pronto.\n📅 Data: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(appointment.date))}.`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handlePrint = () => { openAppointmentPrintPopup(appointment.id); };

  return (
    <>
      <div className="flex min-w-[290px] flex-wrap justify-end gap-2 xl:min-w-[420px]">
        <Button type="button" size="sm" className="rounded-full px-4" onClick={() => setUpsertDialogIsOpen(true)}>
          <EditIcon className="mr-2 size-4" />Editar
        </Button>
        {canManageFinancial && !appointment.paymentConfirmed ? (
          <Button type="button" size="sm" variant="outline" className="rounded-full border-emerald-200 px-4 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => confirmPaymentAction.execute({ appointmentId: appointment.id, paymentMethod: 'pix' })}>
            <Receipt className="mr-2 size-4" />Pagamento
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" className="rounded-full px-4" onClick={handlePrint}>
          <Printer className="mr-2 size-4" />Comprovante
        </Button>
        <Button type="button" size="sm" variant="outline" className="rounded-full border-primary/20 px-4 text-primary hover:bg-primary/10" onClick={handleWhatsapp}>
          <MessageCircle className="mr-2 size-4" />WhatsApp
        </Button>
        {canDelete ? (
          <Button type="button" size="sm" variant="outline" className="rounded-full border-red-200 px-4 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteOpen(true)}>
            <TrashIcon className="mr-2 size-4" />Excluir
          </Button>
        ) : null}
      </div>

      <AddAppointmentForm isOpen={upsertDialogIsOpen} appointment={appointment} patients={patients} doctors={doctors} onSuccess={() => setUpsertDialogIsOpen(false)} onClose={() => setUpsertDialogIsOpen(false)} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser revertida.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAppointmentAction.execute({ id: appointment.id })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AppointmentsTableActions;
