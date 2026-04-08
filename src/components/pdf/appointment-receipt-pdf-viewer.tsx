'use client';

import { useCallback } from 'react';

import { generateAppointmentReceiptPdf, type AppointmentReceiptInput } from '@/lib/pdf-documents';

import PdfPreviewShell from './pdf-preview-shell';

export default function AppointmentReceiptPdfViewer({ data }: { data: AppointmentReceiptInput }) {
  const generator = useCallback(() => generateAppointmentReceiptPdf(data), [data]);

  return (
    <PdfPreviewShell
      title="Comprovante de agendamento"
      subtitle="Documento pronto para baixar, compartilhar ou imprimir."
      fileName={`comprovante-agendamento-${data.patient.name}.pdf`}
      generator={generator}
    />
  );
}
