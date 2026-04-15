'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, FileText, Loader2, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentWaitingCardProps = {
  status?: 'initiated' | 'waiting_payment' | 'paid' | 'expired' | 'cancelled' | null;
  paymentMethod?: 'credit_card' | 'boleto' | null;
  invoiceUrl?: string | null;
};

export function PaymentWaitingCard({ status = 'waiting_payment', paymentMethod = null, invoiceUrl = null }: PaymentWaitingCardProps) {
  const router = useRouter();
  const isBoleto = paymentMethod === 'boleto';
  const isPending = status === 'initiated' || status === 'waiting_payment';
  const isExpired = status === 'expired';
  const isCancelled = status === 'cancelled';

  useEffect(() => {
    if (!isPending) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isPending, router]);

  const title = isExpired
    ? 'Pagamento vencido'
    : isCancelled
      ? 'Pagamento cancelado'
      : isBoleto
        ? 'Aguardando pagamento do boleto'
        : 'Aguardando confirmação do pagamento';

  const description = isExpired
    ? 'O prazo desse pagamento terminou. Gere uma nova cobrança para continuar o cadastro da clínica.'
    : isCancelled
      ? 'Essa cobrança foi cancelada. Gere um novo pagamento para continuar o cadastro da clínica.'
      : isBoleto
        ? 'Assim que o boleto for compensado, o cadastro da clínica será liberado automaticamente.'
        : 'Assim que o pagamento for confirmado pelo Asaas, o cadastro da clínica será liberado automaticamente.';

  return (
    <Card className="w-full border-sky-100 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">{title}</CardTitle>
        <CardDescription className="text-[15px] leading-6 text-slate-600">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-8 text-sm text-slate-600">
        {isPending ? <Loader2 className="h-5 w-5 animate-spin text-sky-600" /> : null}
        <p>
          {isPending ? 'Atualizando status da contratação...' : 'Seu acesso continua bloqueado até existir um pagamento confirmado.'}
        </p>

        {isBoleto && invoiceUrl ? (
          <div className="w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm leading-6 text-slate-600">
                Abra o boleto para realizar o pagamento. Se houver opção no documento, você também pode pagar por Pix.
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

        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.refresh()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar status
          </Button>
          {!isPending ? (
            <Button asChild className="flex-1">
              <Link href="/assinatura">Gerar novo pagamento</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
