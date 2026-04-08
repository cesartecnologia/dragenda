'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  subtitle?: string;
  fileName: string;
  generator: () => Promise<{ output: (type: 'blob') => Blob; save: (name?: string, options?: { returnPromise?: boolean }) => Promise<void> | void; }>;
}

export default function PdfPreviewShell({ title, subtitle, fileName, generator }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<{ output: (type: 'blob') => Blob; save: (name?: string, options?: { returnPromise?: boolean }) => Promise<void> | void; } | null>(null);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const doc = await generator();
        docRef.current = doc;
        const url = URL.createObjectURL(doc.output('blob'));
        revokedUrl = url;
        if (active) setBlobUrl(url);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível gerar o PDF.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [generator]);

  const handleDownload = async () => {
    const doc = docRef.current ?? await generator();
    docRef.current = doc;
    await Promise.resolve(doc.save(fileName));
  };

  const handleOpenNewTab = () => {
    if (blobUrl) window.open(blobUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
        <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleOpenNewTab} disabled={!blobUrl || loading}>
              Abrir em nova aba
            </Button>
            <Button type="button" onClick={() => void handleDownload()} disabled={loading}>
              Baixar PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Gerando documento...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">{error}</div>
        ) : (
          <iframe title={title} src={blobUrl ?? undefined} className="min-h-[75vh] w-full rounded-3xl border border-slate-200 bg-white" />
        )}
      </div>
    </div>
  );
}
