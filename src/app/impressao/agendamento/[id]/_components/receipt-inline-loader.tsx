'use client';

import { useEffect, useState } from 'react';

export default function ReceiptInlineLoader({ appointmentId }: { appointmentId: string }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let currentBlobUrl: string | null = null;

    const load = async () => {
      try {
        const response = await fetch(`/impressao/agendamento/${appointmentId}/arquivo`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Não foi possível gerar o comprovante.');
        }

        const pdfBlob = await response.blob();
        currentBlobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));

        if (active) {
          window.location.replace(`${currentBlobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Não foi possível gerar o comprovante.');
        }
      }
    };

    void load();

    return () => {
      active = false;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [appointmentId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-base font-semibold text-slate-900">Comprovante de agendamento</h1>
        {error ? (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Preparando o documento para impressão...</p>
        )}
      </div>
    </main>
  );
}
