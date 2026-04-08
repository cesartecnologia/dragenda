'use client';

import { Printer } from 'lucide-react';

import { generateAppointmentReceiptPdf, type AppointmentReceiptInput } from '@/lib/pdf-documents';

import OpenPdfButton from './open-pdf-button';

export default function AppointmentReceiptButton({ data }: { data: AppointmentReceiptInput }) {
  return (
    <OpenPdfButton
      size="sm"
      variant="outline"
      className="rounded-full px-4"
      fileName={`comprovante-agendamento-${data.patient.name}.pdf`}
      generator={() => generateAppointmentReceiptPdf(data)}
    >
      <Printer className="mr-2 size-4" />Comprovante
    </OpenPdfButton>
  );
}
