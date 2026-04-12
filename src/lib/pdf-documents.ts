import jsPDF from 'jspdf';

import { formatCurrencyInCents } from '@/helpers/currency';
import { formatCnpj, formatPhoneNumber } from '@/helpers/format';
import { formatClinicAddress } from '@/helpers/clinic-address';
import { formatDateBr, formatDateTimeBr } from '@/helpers/time';

const TEXT: [number, number, number] = [45, 55, 72];
const MUTED: [number, number, number] = [108, 122, 137];
const LINE: [number, number, number] = [211, 219, 229];
const ACCENT: [number, number, number] = [59, 130, 246];

export type ClinicPdfData = {
  name: string;
  cnpj?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  logoUrl?: string | null;
};

export type PatientPdfData = {
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
};

export type DoctorPdfData = {
  name: string;
  specialty: string;
  crm: string;
};

export type AppointmentPdfData = {
  id: string;
  date: string;
  appointmentPriceInCents: number;
  paymentConfirmed: boolean;
  paymentMethod?: string | null;
  paymentDate?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string | null;
  cancelledAt?: string | null;
};

export type AppointmentReceiptInput = {
  clinic: ClinicPdfData;
  patient: PatientPdfData;
  doctor: DoctorPdfData;
  appointment: AppointmentPdfData;
  attendantName: string;
  cancelledByName?: string | null;
};

export type ReportAppointmentRow = {
  patientName: string;
  patientPhone?: string | null;
  doctorName: string;
  specialty: string;
  date: string;
  paymentConfirmed: boolean;
  paymentMethod?: string | null;
  valueInCents: number;
  status: 'scheduled' | 'completed' | 'cancelled';
};

export type ReportPdfInput = {
  clinic: ClinicPdfData;
  generatedAt: string;
  from: string;
  to: string;
  doctorName: string;
  paymentLabel: string;
  totalConfirmedInCents: number;
  totalPendingInCents: number;
  appointmentsCount: number;
  appointments: ReportAppointmentRow[];
};

function paymentMethodLabel(value?: string | null) {
  if (value === 'cash') return 'Dinheiro';
  if (value === 'pix') return 'Pix';
  if (value === 'card') return 'Cartão';
  if (value === 'insurance') return 'Convênio';
  if (value === 'other') return 'Outro';
  return '-';
}

async function remoteImageToDataUrl(url?: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    if (typeof window === 'undefined') {
      return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
    }

    const blob = new Blob([buffer], { type: contentType });
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function setText(doc: jsPDF, value: string | string[], x: number, y: number, options?: {
  size?: number;
  style?: 'normal' | 'bold';
  color?: [number, number, number];
  align?: 'left' | 'center' | 'right';
}) {
  doc.setFont('helvetica', options?.style ?? 'normal');
  doc.setFontSize(options?.size ?? 10);
  doc.setTextColor(...(options?.color ?? TEXT));
  doc.text(value as never, x, y, options?.align ? { align: options.align } : undefined);
}

function rule(doc: jsPDF, y: number, x1 = 10, x2 = 200) {
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(x1, y, x2, y);
}

function wrapText(doc: jsPDF, value: string, width: number) {
  return doc.splitTextToSize(value || '-', width) as string[];
}

function writeWrapped(doc: jsPDF, value: string, x: number, y: number, width: number, options?: {
  size?: number;
  style?: 'normal' | 'bold';
  color?: [number, number, number];
}) {
  const lines = wrapText(doc, value || '-', width);
  setText(doc, lines, x, y, { size: options?.size ?? 9.5, style: options?.style, color: options?.color });
  return y + (lines.length * ((options?.size ?? 9.5) <= 8.5 ? 3.7 : 4.4));
}

async function drawClinicBlock(doc: jsPDF, clinic: ClinicPdfData, yStart: number, pageWidth: number) {
  const logo = await remoteImageToDataUrl(clinic.logoUrl);
  let textX = 12;
  if (logo) {
    try {
      doc.addImage(logo, undefined, 12, yStart, 14, 14, undefined, 'FAST');
      textX = 30;
    } catch {
      textX = 12;
    }
  }

  setText(doc, clinic.name, textX, yStart + 4, { size: 13, style: 'bold' });
  const line2 = [clinic.cnpj ? `CNPJ: ${formatCnpj(clinic.cnpj)}` : '', clinic.phoneNumber ? `Tel: ${formatPhoneNumber(clinic.phoneNumber)}` : '']
    .filter(Boolean)
    .join('   ');
  let endY = yStart + 8;
  if (line2) {
    setText(doc, line2, textX, yStart + 8.5, { size: 8.5, color: MUTED });
    endY = yStart + 8.5;
  }
  const formattedClinicAddress = formatClinicAddress(clinic);
  if (formattedClinicAddress) {
    endY = writeWrapped(doc, formattedClinicAddress, textX, yStart + 13, pageWidth - textX - 10, { size: 8.5, color: MUTED });
  }
  return endY;
}

export async function generateAppointmentReceiptPdf(input: AppointmentReceiptInput) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = await drawClinicBlock(doc, input.clinic, 10, pageWidth);
  y += 5;
  rule(doc, y, 10, pageWidth - 10);
  y += 6;

  setText(doc, 'COMPROVANTE DE AGENDAMENTO', pageWidth / 2, y, { size: 11.5, style: 'bold', align: 'center' });
  y += 6;
  setText(doc, `Emissão: ${formatDateTimeBr(new Date())}`, pageWidth / 2, y, { size: 8.5, color: MUTED, align: 'center' });
  y += 7;

  setText(doc, 'Paciente', 12, y, { size: 9, style: 'bold', color: ACCENT });
  y = writeWrapped(doc, input.patient.name, 12, y + 4.5, 82, { size: 9.5 });
  if (input.patient.phoneNumber) y = writeWrapped(doc, `Telefone: ${formatPhoneNumber(input.patient.phoneNumber)}`, 12, y + 1, 82, { size: 8.5, color: MUTED });

  let rightY = y - 14;
  setText(doc, 'Médico', 104, rightY, { size: 9, style: 'bold', color: ACCENT });
  rightY = writeWrapped(doc, input.doctor.name, 104, rightY + 4.5, 82, { size: 9.5 });
  rightY = writeWrapped(doc, `${input.doctor.specialty} - CRM ${input.doctor.crm}`, 104, rightY + 1, 82, { size: 8.5, color: MUTED });
  y = Math.max(y, rightY) + 5;

  rule(doc, y, 10, pageWidth - 10);
  y += 6;
  setText(doc, 'Data e horário', 12, y, { size: 9, style: 'bold', color: ACCENT });
  setText(doc, 'Valor', 104, y, { size: 9, style: 'bold', color: ACCENT });
  y += 4.5;
  setText(doc, formatDateTimeBr(input.appointment.date), 12, y, { size: 9.5 });
  setText(doc, formatCurrencyInCents(input.appointment.appointmentPriceInCents), 104, y, { size: 9.5 });
  y += 7;

  setText(doc, 'Pagamento', 12, y, { size: 9, style: 'bold', color: ACCENT });
  setText(doc, 'Atendente', 104, y, { size: 9, style: 'bold', color: ACCENT });
  y += 4.5;
  setText(doc, input.appointment.paymentConfirmed ? `Pago - ${paymentMethodLabel(input.appointment.paymentMethod)}` : 'Pendente', 12, y, { size: 9.5 });
  setText(doc, input.attendantName || '-', 104, y, { size: 9.5 });
  y += 7;

  setText(doc, 'Observações', 12, y, { size: 9, style: 'bold', color: ACCENT });
  y = writeWrapped(doc, input.appointment.notes || 'Sem observações registradas.', 12, y + 4.5, 176, { size: 8.8 });
  if (input.appointment.status === 'cancelled') {
    y = writeWrapped(doc, `Situação: cancelado${input.cancelledByName ? ` por ${input.cancelledByName}` : ''}${input.appointment.cancelledAt ? ` em ${formatDateTimeBr(input.appointment.cancelledAt)}` : ''}.`, 12, y + 1.5, 176, { size: 8.2, color: MUTED });
  }
  y += 4;
  rule(doc, y, 10, pageWidth - 10);
  y += 5;
  setText(doc, 'Orientação ao paciente', 12, y, { size: 9, style: 'bold', color: ACCENT });
  y = writeWrapped(doc, 'Favor comparecer com 15 minutos de antecedência.', 12, y + 4.5, 176, { size: 8.8, color: MUTED });

  doc.setProperties({ title: `comprovante-agendamento-${input.patient.name}` });
  return doc;
}

export async function generateReportPdf(input: ReportPdfInput) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = await drawClinicBlock(doc, input.clinic, 12, pageWidth);
  y += 6;
  rule(doc, y, 10, pageWidth - 10);
  y += 7;

  setText(doc, 'RELATÓRIO DE AGENDAMENTOS', pageWidth / 2, y, { size: 12, style: 'bold', align: 'center' });
  y += 7;
  setText(doc, `Período: ${formatDateBr(input.from)} a ${formatDateBr(input.to)}`, 10, y, { size: 9 });
  setText(doc, `Médico: ${input.doctorName}`, 10, y + 5, { size: 9 });
  setText(doc, `Pagamento: ${input.paymentLabel}`, 110, y + 5, { size: 9 });
  setText(doc, `Emitido em ${formatDateTimeBr(input.generatedAt)}`, pageWidth - 10, y, { size: 8.5, color: MUTED, align: 'right' });
  y += 14;

  setText(doc, `Atendimentos: ${input.appointmentsCount}`, 10, y, { size: 9, style: 'bold' });
  setText(doc, `Confirmado: ${formatCurrencyInCents(input.totalConfirmedInCents)}`, 70, y, { size: 9, style: 'bold' });
  setText(doc, `Pendente: ${formatCurrencyInCents(input.totalPendingInCents)}`, 140, y, { size: 9, style: 'bold' });
  y += 7;
  rule(doc, y, 10, pageWidth - 10);
  y += 7;

  const drawTableHeader = (headerY: number) => {
    setText(doc, 'Paciente', 10, headerY, { size: 8.5, style: 'bold' });
    setText(doc, 'Médico', 72, headerY, { size: 8.5, style: 'bold' });
    setText(doc, 'Data', 130, headerY, { size: 8.5, style: 'bold' });
    setText(doc, 'Pagamento', 156, headerY, { size: 8.5, style: 'bold' });
    setText(doc, 'Valor', pageWidth - 10, headerY, { size: 8.5, style: 'bold', align: 'right' });
    rule(doc, headerY + 3, 10, pageWidth - 10);
    return headerY + 8;
  };

  y = drawTableHeader(y);

  if (!input.appointments.length) {
    writeWrapped(doc, 'Nenhum agendamento encontrado para os filtros selecionados.', 10, y, 190, { size: 9, color: MUTED });
  } else {
    for (const item of input.appointments) {
      const patientLines = wrapText(doc, item.patientName, 55);
      const doctorLines = wrapText(doc, `${item.doctorName} - ${item.specialty}`, 50);
      const dateLines = wrapText(doc, formatDateTimeBr(item.date), 22);
      const paymentLines = wrapText(doc, item.paymentConfirmed ? paymentMethodLabel(item.paymentMethod) : 'Pendente', 28);
      const rowHeight = Math.max(patientLines.length, doctorLines.length, dateLines.length, paymentLines.length) * 4 + 2;

      if (y + rowHeight > 282) {
        doc.addPage();
        y = drawTableHeader(16);
      }

      setText(doc, patientLines, 10, y, { size: 8.2 });
      setText(doc, doctorLines, 72, y, { size: 8.2 });
      setText(doc, dateLines, 130, y, { size: 8.2 });
      setText(doc, paymentLines, 156, y, { size: 8.2 });
      setText(doc, formatCurrencyInCents(item.valueInCents), pageWidth - 10, y, { size: 8.2, align: 'right' });
      y += rowHeight;
      rule(doc, y, 10, pageWidth - 10);
      y += 3;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setText(doc, `${input.clinic.name} - Página ${page} de ${pageCount}`, pageWidth / 2, 292, { size: 8, color: MUTED, align: 'center' });
  }

  doc.setProperties({ title: `relatorio-${input.clinic.name}` });
  return doc;
}
