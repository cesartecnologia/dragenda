'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';

interface Props extends ButtonProps {
  fileName: string;
  generator: () => Promise<{ output: (type: 'bloburl' | 'blob') => string | Blob }>;
}

export default function OpenPdfButton({ fileName, generator, children, ...props }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const doc = await generator();
      const blobUrl = doc.output('bloburl') as string;
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = fileName;
        link.click();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" onClick={() => void handleClick()} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
