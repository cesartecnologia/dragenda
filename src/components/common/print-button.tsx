'use client';

import { Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function PrintButton({ label = 'Imprimir / Salvar PDF' }: { label?: string }) {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer className="mr-2 size-4" />
      {label}
    </Button>
  );
}
