'use client';

import { useCallback } from 'react';

import { generateReportPdf, type ReportPdfInput } from '@/lib/pdf-documents';

import PdfPreviewShell from './pdf-preview-shell';

export default function ReportPdfViewer({ data }: { data: ReportPdfInput }) {
  const generator = useCallback(() => generateReportPdf(data), [data]);

  return (
    <PdfPreviewShell
      title="Relatório em PDF"
      subtitle="Relatório pronto para baixar ou imprimir em PDF."
      fileName={`relatorio-${data.clinic.name}.pdf`}
      generator={generator}
    />
  );
}
