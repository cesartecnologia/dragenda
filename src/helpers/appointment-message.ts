import { formatClinicAddress, formatPhoneNumber } from './format';
import { formatCurrencyInCents } from './currency';
import { formatDateTimeBr } from './time';

interface ClinicInfo {
  name?: string | null;
  cnpj?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  province?: string | null;
  postalCode?: string | null;
}

interface AppointmentMessageInput {
  clinic?: ClinicInfo | null;
  patientName: string;
  doctorName: string;
  specialty?: string | null;
  date: Date | string;
  appointmentPriceInCents: number;
  notes?: string | null;
  paymentConfirmed?: boolean;
  status?: 'scheduled' | 'cancelled' | string | null;
}

export const buildAppointmentWhatsappText = ({
  clinic,
  patientName,
  doctorName,
  specialty,
  date,
  appointmentPriceInCents,
  notes,
  paymentConfirmed,
  status,
}: AppointmentMessageInput) => {
  const isCancelled = status === 'cancelled';
  const clinicAddress = formatClinicAddress(clinic);

  const lines = [
    `*Olá, ${patientName}!*`,
    '',
    isCancelled ? '*Atualização do agendamento*' : '*Comprovante do agendamento*',
    '',
    `• Clínica: ${clinic?.name ?? 'Clínica'}`,
    `• Médico: ${doctorName}`,
    specialty ? `• Especialidade: ${specialty}` : null,
    `• Data e horário: ${formatDateTimeBr(date)}`,
    `• Valor: ${formatCurrencyInCents(appointmentPriceInCents)}`,
    `• Pagamento: ${paymentConfirmed ? 'Confirmado' : 'Pendente'}`,
    clinic?.phoneNumber ? `• Contato: ${formatPhoneNumber(clinic.phoneNumber)}` : null,
    clinicAddress ? `• Endereço: ${clinicAddress}` : null,
    notes ? `• Observações: ${notes}` : null,
    '',
    isCancelled
      ? 'Seu agendamento foi cancelado. Se precisar, fale com a clínica para reagendar.'
      : 'Observação: chegue 15 minutos antes do horário marcado.',
    '',
    isCancelled ? null : 'Qualquer dúvida, estamos a disposição.',
  ].filter(Boolean);

  return lines.join('\n');
};
