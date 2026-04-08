import type { AppointmentPaymentMethod, AppointmentStatus } from '@/db/schema';

export const getAppointmentPaymentMethodLabel = (value?: AppointmentPaymentMethod | null) => {
  if (value === 'cash') return 'Dinheiro';
  if (value === 'pix') return 'Pix';
  if (value === 'card') return 'Cartão';
  if (value === 'insurance') return 'Convênio';
  if (value === 'other') return 'Outro';
  return 'Não informado';
};

export const getAppointmentStatusLabel = (status?: AppointmentStatus | null) => {
  if (status === 'cancelled') return 'Cancelado';
  return 'Agendado';
};
