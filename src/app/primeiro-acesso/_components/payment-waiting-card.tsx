'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentWaitingCardProps = {
  paymentMethod?: 'credit_card' | 'boleto' | null;
  invoiceUrl?: string | null;
};

export function PaymentWaitingCard({ paymentMethod = null, invoiceUrl = null }: PaymentWaitingCardProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [router]);

  const isBoleto = paymentMethod === 'boleto';

  return (
    <Card className="w-full border-sky-100 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">
          {isBoleto ? 'Aguardando pagamento do boleto' : 'Confirmando pagamento'}
        </CardTitle>
        <CardDescription className="text-[15px] leading-6 text-slate-600">
          {isBoleto
            ? 'Assim que o pagamento for confirmado, o cadastro da clínica será liberado automaticamente.'
            : 'Estamos validando sua assinatura. Assim que a confirmação chegar, o cadastro será liberado automaticamente.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-8 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
        <p>Atualizando status da contratação...</p>
        {isBoleto && invoiceUrl ? (
          <div className="w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm leading-6 text-slate-600">
                Abra o boleto para realizar o pagamento. Você também pode pagar esse boleto por Pix, se essa opção estiver disponível no documento.
              </p>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link href={invoiceUrl} target="_blank" rel="noreferrer">
                <CreditCard className="mr-2 h-4 w-4" />
                Abrir boleto
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
