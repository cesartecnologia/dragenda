'use client';

import { useState } from 'react';

import dayjs from 'dayjs';

import { useAction } from 'next-safe-action/hooks';
import { Ban, CalendarRange, CheckCircle2, EditIcon, MessageCircle, Printer, Receipt, RotateCcw, TrashIcon, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteAppointment } from '@/actions/delete-appointment';
import { changeAppointmentStatus, updateAppointmentPayment } from '@/actions/update-appointment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appointmentsTable, clinicsTable, doctorsTable, patientsTable, type AppointmentPaymentMethod, type UserRole } from '@/db/schema';
import { buildAppointmentWhatsappText } from '@/helpers/appointment-message';
import { openAppointmentPrintPopup } from '@/helpers/open-appointment-print-popup';
import { canManageFinancialActions, isAdminRole } from '@/lib/access';

import AddAppointmentForm from '../../../appointments/_components/add-appointment-form';
import AppointmentActionsGrid from '../../../appointments/_components/appointment-actions-grid';

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

type ClinicSummary = Pick<typeof clinicsTable.$inferSelect, 'name' | 'phoneNumber' | 'address' | 'cnpj' | 'logoUrl'>;

const canCompleteAppointmentAt = (value: Date | string) => !dayjs(value).isAfter(dayjs());

interface Props {
  appointment: AppointmentWithRelations;
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  role?: UserRole | null;
  clinic?: ClinicSummary | null;
}

export default function AppointmentDetailActions({ appointment, patients, doctors, role, clinic }: Props) {
  const [editingOpen, setEditingOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<AppointmentPaymentMethod>(appointment.paymentMethod ?? 'pix');

  const isAdmin = isAdminRole(role);

  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success('Agendamento excluído com sucesso.');
      setDeleteOpen(false);
      window.location.href = '/agendamentos';
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao excluir agendamento.'),
  });

  const confirmPaymentAction = useAction(updateAppointmentPayment, {
    onSuccess: () => {
      toast.success('Pagamento confirmado com sucesso.');
      setPaymentOpen(false);
    },
    onError: () => toast.error('Erro ao confirmar pagamento.'),
  });

  const changeStatusAction = useAction(changeAppointmentStatus, {
    onSuccess: () => {
      toast.success('Status do agendamento atualizado com sucesso.');
      setStatusOpen(false);
      setCompletionOpen(false);
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível atualizar o status do agendamento.'),
  });

  const handleWhatsapp = () => {
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

    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const primaryActions = [
    {
      key: 'edit',
      label: 'Editar agendamento',
      icon: EditIcon,
      variant: 'default' as const,
      onClick: () => setEditingOpen(true),
    },
    {
      key: 'reschedule',
      label: 'Remarcar horário',
      icon: CalendarRange,
      onClick: () => setEditingOpen(true),
    },
    {
      key: 'complete',
      label: appointment.status === 'completed' ? 'Reabrir como agendada' : 'Consulta concluída',
      icon: appointment.status === 'completed' ? Undo2 : CheckCircle2,
      className: 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800',
      hidden:
        appointment.status === 'cancelled'
        || (appointment.status === 'completed' && !isAdmin)
        || (appointment.status !== 'completed' && !canCompleteAppointmentAt(appointment.date)),
      onClick: () => setCompletionOpen(true),
    },
    {
      key: 'status',
      label: appointment.status === 'cancelled' ? 'Reativar agendamento' : 'Cancelar agendamento',
      icon: appointment.status === 'cancelled' ? RotateCcw : Ban,
      className: appointment.status === 'cancelled'
        ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
        : 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800',
      hidden: appointment.status === 'cancelled' && !isAdmin,
      onClick: () => setStatusOpen(true),
    },
  ];

  const secondaryActions = [
    {
      key: 'payment',
      label: 'Confirmar pagamento',
      icon: Receipt,
      className: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800',
      hidden: !canManageFinancialActions(role) || appointment.paymentConfirmed || appointment.status === 'cancelled',
      onClick: () => {
        setPaymentMethod(appointment.paymentMethod ?? 'pix');
        setPaymentOpen(true);
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
      className: 'border-primary/20 text-primary hover:bg-primary/10',
      onClick: handleWhatsapp,
    },
    {
      key: 'delete',
      label: 'Excluir agendamento',
      icon: TrashIcon,
      className: 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700',
      hidden: !isAdmin,
      onClick: () => setDeleteOpen(true),
    },
  ];

  return (
    <>
      <div className="rounded-3xl border border-border/70 bg-background p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">Ações do agendamento</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Todos os comandos principais concentrados em uma grade compacta e alinhada.</p>
        </div>
        <AppointmentActionsGrid actions={[...primaryActions, ...secondaryActions]} />
      </div>

      <AddAppointmentForm
        isOpen={editingOpen}
        appointment={appointment}
        patients={patients}
        doctors={doctors}
        onSuccess={() => setEditingOpen(false)}
        onClose={() => setEditingOpen(false)}
      />

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
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
            <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={() => confirmPaymentAction.execute({ appointmentId: appointment.id, paymentMethod })}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={completionOpen} onOpenChange={setCompletionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{appointment.status === 'completed' ? 'Reabrir consulta' : 'Concluir consulta'}</AlertDialogTitle>
            <AlertDialogDescription>
              {appointment.status === 'completed'
                ? 'A consulta voltará a ficar como agendada para acompanhamento no sistema.'
                : 'Deseja marcar esta consulta como concluída?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => changeStatusAction.execute({ appointmentId: appointment.id, status: appointment.status === 'completed' ? 'scheduled' : 'completed' })}>
              {appointment.status === 'completed' ? 'Reabrir' : 'Concluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusOpen} onOpenChange={setStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{appointment.status === 'cancelled' ? 'Reativar agendamento' : 'Cancelar agendamento'}</AlertDialogTitle>
            <AlertDialogDescription>
              {appointment.status === 'cancelled'
                ? 'O agendamento voltará a ficar disponível normalmente no sistema.'
                : 'Deseja mesmo cancelar este agendamento? O cancelamento é irreversível.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => changeStatusAction.execute({ appointmentId: appointment.id, status: appointment.status === 'cancelled' ? 'scheduled' : 'cancelled' })}>
              {appointment.status === 'cancelled' ? 'Reativar' : 'Cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
}
