'use client';

import { useEffect } from 'react';

export default function ReceiptPrintClient() {
  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const runPrint = () => {
      if (cancelled) return;

      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        window.focus();
        window.print();
      }, 350);
    };

    if (document.readyState === 'complete') {
      runPrint();
    } else {
      window.addEventListener('load', runPrint, { once: true });
    }

    const handleAfterPrint = () => {
      if (cancelled) return;
      window.close();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('afterprint', handleAfterPrint);
      window.removeEventListener('load', runPrint);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Imprimir
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Fechar
      </button>
    </div>
  );
}
