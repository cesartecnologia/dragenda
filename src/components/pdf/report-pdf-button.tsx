'use client';

import { FileText } from 'lucide-react';

import { generateReportPdf, type ReportPdfInput } from '@/lib/pdf-documents';

import OpenPdfButton from './open-pdf-button';

export default function ReportPdfButton({ data }: { data: ReportPdfInput }) {
  return (
    <OpenPdfButton
      variant="outline"
      fileName={`relatorio-${data.clinic.name}.pdf`}
      generator={() => generateReportPdf(data)}
    >
      <FileText className="mr-2 size-4" />Gerar PDF
    </OpenPdfButton>
  );
}
