'use client';

import { useMemo, useState } from 'react';

import dayjs from 'dayjs';
import Image from 'next/image';

import { useAction } from 'next-safe-action/hooks';
import { Ban, CalendarRange, CheckCircle2, EditIcon, MessageCircle, Printer, Receipt, RotateCcw, Stethoscope, TrashIcon, Undo2, UserRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { deleteAppointment } from '@/actions/delete-appointment';
import { changeAppointmentStatus, updateAppointmentPayment } from '@/actions/update-appointment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { appointmentsTable, clinicsTable, doctorsTable, patientsTable, type AppointmentPaymentMethod, type PatientSex, type UserRole } from '@/db/schema';
import { buildAppointmentWhatsappText } from '@/helpers/appointment-message';
import { formatCurrencyInCents } from '@/helpers/currency';
import { openAppointmentPrintPopup } from '@/helpers/open-appointment-print-popup';
import { formatPhoneNumber } from '@/helpers/format';
import { formatDateTimeBr } from '@/helpers/time';
import { canManageFinancialActions, isAdminRole } from '@/lib/access';

import AddAppointmentForm from './add-appointment-form';
import AppointmentRowActions from './appointment-row-actions';
import { getAppointmentsTableColumns } from './table-columns';

type AppointmentWithRelations = typeof appointmentsTable.$inferSelect & {
  patient: typeof patientsTable.$inferSelect;
  doctor: typeof doctorsTable.$inferSelect;
};

type ClinicSummary = Pick<typeof clinicsTable.$inferSelect, 'name' | 'phoneNumber' | 'address' | 'cnpj' | 'logoUrl'>;

const canCompleteAppointmentAt = (value: Date | string) => !dayjs(value).isAfter(dayjs());

const getSexAvatarIcon = (sex?: PatientSex | null) => (sex === 'female' ? '/icons/patient-female.svg' : '/icons/patient-male.svg');

export default function AppointmentsDataTable({
  data,
  patients,
  doctors,
  role,
  clinic,
  variant = 'table',
}: {
  data: AppointmentWithRelations[];
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  role?: UserRole | null;
  clinic?: ClinicSummary | null;
  variant?: 'table' | 'cards';
}) {
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppointmentWithRelations | null>(null);
  const [statusTarget, setStatusTarget] = useState<AppointmentWithRelations | null>(null);
  const [completionTarget, setCompletionTarget] = useState<AppointmentWithRelations | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<AppointmentWithRelations | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<AppointmentPaymentMethod>('pix');

  const isAdmin = isAdminRole(role);

  const deleteAppointmentAction = useAction(deleteAppointment, {
    onSuccess: () => {
      toast.success('Agendamento excluído com sucesso.');
      setDeleteTarget(null);
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao excluir agendamento.'),
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
      setCompletionTarget(null);
    },
    onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível atualizar o status do agendamento.'),
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
      key: 'complete',
      label: appointment.status === 'completed' ? 'Reabrir como agendada' : 'Consulta concluída',
      icon: appointment.status === 'completed' ? Undo2 : CheckCircle2,
      hidden:
        appointment.status === 'cancelled'
        || (appointment.status === 'completed' && !isAdmin)
        || (appointment.status !== 'completed' && !canCompleteAppointmentAt(appointment.date)),
      onClick: () => setCompletionTarget(appointment),
    },
    {
      key: 'status',
      label: appointment.status === 'cancelled' ? 'Reativar agendamento' : 'Cancelar agendamento',
      icon: appointment.status === 'cancelled' ? RotateCcw : Ban,
      hidden: appointment.status === 'cancelled' && !isAdmin,
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
      hidden: !isAdmin,
      destructive: true,
      onClick: () => setDeleteTarget(appointment),
    },
  ];

  const orderedAppointments = useMemo(
    () => [...data].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()),
    [data],
  );

  const columns = useMemo(
    () => getAppointmentsTableColumns({
      renderActions: (appointment) => (
        <AppointmentRowActions patientName={appointment.patient.name} actions={getRowActions(appointment)} />
      ),
    }),
    [clinic, role],
  );

  const renderCards = () => {
    if (!data.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Nenhum agendamento encontrado com os filtros selecionados.
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {orderedAppointments.map((appointment) => {
          const statusBadge = appointment.status === 'cancelled'
            ? <span className="inline-flex min-h-9 items-center rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700">Cancelado</span>
            : appointment.status === 'completed'
              ? <span className="inline-flex min-h-9 items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Consulta concluída</span>
              : <span className="inline-flex min-h-9 items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">Agendado</span>;

          return (
            <Card key={appointment.id} className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden">
                      <Image
                        src={getSexAvatarIcon(appointment.patient.sex)}
                        alt={appointment.patient.sex === 'female' ? 'Ícone paciente feminina' : 'Ícone paciente masculino'}
                        width={64}
                        height={88}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="space-y-1">
                        <h3 className="truncate text-[1.52rem] font-semibold leading-tight tracking-[-0.02em] text-slate-800">{appointment.patient.name}</h3>
                        <p className="truncate text-sm font-medium text-slate-500">{formatPhoneNumber(appointment.patient.phoneNumber)}</p>
                      </div>
                    </div>
                  </div>
                  <div onClick={(event) => event.stopPropagation()}>
                    <AppointmentRowActions patientName={appointment.patient.name} actions={getRowActions(appointment)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-5 py-5 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                    <UserRound className="size-4" />
                    {appointment.doctor.name}
                  </span>
                  {statusBadge}
                </div>
                <div className="flex items-center gap-2"><Stethoscope className="size-4 text-slate-400" /><span>{appointment.doctor.specialty}</span></div>
                <div className="flex items-center gap-2"><CalendarRange className="size-4 text-slate-400" /><span>{formatDateTimeBr(appointment.date)}</span></div>
                <div className="flex items-center gap-2"><Wallet className="size-4 text-slate-400" /><span>{formatCurrencyInCents(appointment.appointmentPriceInCents)}</span></div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {appointment.paymentConfirmed ? 'Pagamento confirmado' : 'Pagamento pendente'}
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
                {appointment.notes ? (
                  <p className="line-clamp-2">{appointment.notes}</p>
                ) : (
                  <p>Nenhuma observação registrada.</p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {variant === 'cards' ? renderCards() : <DataTable data={orderedAppointments} columns={columns} />}

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

      <AlertDialog open={!!completionTarget} onOpenChange={(open) => !open && setCompletionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{completionTarget?.status === 'completed' ? 'Reabrir consulta' : 'Concluir consulta'}</AlertDialogTitle>
            <AlertDialogDescription>
              {completionTarget?.status === 'completed'
                ? 'A consulta voltará a ficar como agendada para acompanhamento no sistema.'
                : 'Deseja marcar esta consulta como concluída?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => completionTarget && changeStatusAction.execute({ appointmentId: completionTarget.id, status: completionTarget.status === 'completed' ? 'scheduled' : 'completed' })}>
              {completionTarget?.status === 'completed' ? 'Reabrir' : 'Concluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusTarget?.status === 'cancelled' ? 'Reativar agendamento' : 'Cancelar agendamento'}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget?.status === 'cancelled'
                ? 'O agendamento voltará a ficar disponível normalmente no sistema.'
                : 'Deseja mesmo cancelar este agendamento? O cancelamento é irreversível.'}
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
