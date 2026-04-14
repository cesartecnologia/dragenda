
'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PaymentWaitingCard() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <Card className="w-full border-sky-100 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">Confirmando pagamento</CardTitle>
        <CardDescription className="text-[15px] leading-6 text-slate-600">
          Estamos validando sua assinatura. Assim que a confirmação chegar, o cadastro será liberado automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-8 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
        <p>Atualizando status da contratação...</p>
      </CardContent>
    </Card>
  );
}
