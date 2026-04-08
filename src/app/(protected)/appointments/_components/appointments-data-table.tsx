'use client';

import { useMemo, useState } from 'react';

import { useAction } from 'next-safe-action/hooks';
import { Ban, CalendarRange, EditIcon, MessageCircle, Printer, Receipt, RotateCcw, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

import { deleteAppointment } from '@/actions/delete-appointment';
import { changeAppointmentStatus, updateAppointmentPayment } from '@/actions/update-appointment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appointmentsTable, clinicsTable, doctorsTable, patientsTable, type AppointmentPaymentMethod, type UserRole } from '@/db/schema';
import { buildAppointmentWhatsappText } from '@/helpers/appointment-message';
import { openAppointmentPrintPopup } from '@/helpers/open-appointment-print-popup';
import { getAppointmentsTableColumns } from './table-columns';
import { canDeleteRecords, canManageFinancialActions } from '@/lib/access';

import AddAppointmentForm from './add-appointment-form';
import AppointmentRowActions from './appointment-row-actions';

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

type ClinicSummary = Pick<typeof clinicsTable.$inferSelect, 'name' | 'phoneNumber' | 'address' | 'cnpj' | 'logoUrl'>;

export default function AppointmentsDataTable({
  data,
  patients,
  doctors,
  role,
  clinic,
}: {
  data: AppointmentWithRelations[];
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  role?: UserRole | null;
  clinic?: ClinicSummary | null;
}) {
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppointmentWithRelations | null>(null);
  const [statusTarget, setStatusTarget] = useState<AppointmentWithRelations | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<AppointmentWithRelations | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<AppointmentPaymentMethod>('pix');

  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success('Agendamento excluído com sucesso.');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Erro ao excluir agendamento.'),
  });

  const confirmPaymentAction = useAction(updateAppointmentPayment, {
    onSuccess: () => {
      toast.success('Pagamento confirmado com sucesso.');
      setPaymentTarget(null);
    },
    onError: () => toast.error('Erro ao confirmar pagamento.'),
  });

  const changeStatusAction = useAction(changeAppointmentStatus, {
    onSuccess: () => {
      toast.success('Status do agendamento atualizado com sucesso.');
      setStatusTarget(null);
    },
    onError: () => toast.error('Não foi possível atualizar o status do agendamento.'),
  });

  const renderWhatsapp = (appointment: AppointmentWithRelations) => {
    const phone = appointment.patient.phoneNumber.replace(/\D/g, '');
    const message = encodeURIComponent(buildAppointmentWhatsappText({
      clinic,
      patientName: appointment.patient.name,
      doctorName: appointment.doctor.name,
      specialty: appointment.doctor.specialty,
      date: appointment.date,
      appointmentPriceInCents: appointment.appointmentPriceInCents,
      notes: appointment.notes,
      paymentConfirmed: appointment.paymentConfirmed,
      status: appointment.status,
    }));
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const getRowActions = (appointment: AppointmentWithRelations) => [
    {
      key: 'edit',
      label: 'Editar agendamento',
      icon: EditIcon,
      onClick: () => setEditingAppointment(appointment),
    },
    {
      key: 'reschedule',
      label: 'Remarcar horário',
      icon: CalendarRange,
      onClick: () => setEditingAppointment(appointment),
    },
    {
      key: 'status',
      label: appointment.status === 'cancelled' ? 'Reativar agendamento' : 'Cancelar agendamento',
      icon: appointment.status === 'cancelled' ? RotateCcw : Ban,
      onClick: () => setStatusTarget(appointment),
    },
    {
      key: 'payment',
      label: 'Confirmar pagamento',
      icon: Receipt,
      hidden: !canManageFinancialActions(role) || appointment.paymentConfirmed || appointment.status === 'cancelled',
      onClick: () => {
        setPaymentMethod(appointment.paymentMethod ?? 'pix');
        setPaymentTarget(appointment);
      },
    },
    {
      key: 'receipt',
      label: 'Gerar comprovante',
      icon: Printer,
      onClick: () => openAppointmentPrintPopup(appointment.id),
    },
    {
      key: 'whatsapp',
      label: 'Enviar no WhatsApp',
      icon: MessageCircle,
      onClick: () => renderWhatsapp(appointment),
    },
    {
      key: 'delete',
      label: 'Excluir agendamento',
      icon: TrashIcon,
      hidden: !canDeleteRecords(role),
      destructive: true,
      onClick: () => setDeleteTarget(appointment),
    },
  ];

  const columns = useMemo(
    () => getAppointmentsTableColumns({
      renderActions: (appointment) => (
        <AppointmentRowActions patientName={appointment.patient.name} actions={getRowActions(appointment)} />
      ),
    }),
    [clinic, role],
  );

  return (
    <>
      <DataTable data={data} columns={columns} />

      <AddAppointmentForm isOpen={!!editingAppointment} appointment={editingAppointment ?? undefined} patients={patients} doctors={doctors} onSuccess={() => setEditingAppointment(null)} onClose={() => setEditingAppointment(null)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser revertida.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteAppointmentAction.execute({ id: deleteTarget.id })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!paymentTarget} onOpenChange={(open) => !open && setPaymentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
            <DialogDescription>Escolha a forma de pagamento usada neste atendimento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Forma de pagamento</label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as AppointmentPaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="insurance">Convênio</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPaymentTarget(null)}>Cancelar</Button>
            <Button type="button" onClick={() => paymentTarget && confirmPaymentAction.execute({ appointmentId: paymentTarget.id, paymentMethod })}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusTarget?.status === 'cancelled' ? 'Reativar agendamento' : 'Cancelar agendamento'}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.status === 'cancelled'
                ? 'O agendamento voltará a ficar disponível normalmente no sistema.'
                : 'O agendamento será mantido no histórico, mas deixará de contar como ativo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => statusTarget && changeStatusAction.execute({ appointmentId: statusTarget.id, status: statusTarget.status === 'cancelled' ? 'scheduled' : 'cancelled' })}>
              {statusTarget?.status === 'cancelled' ? 'Reativar' : 'Cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
