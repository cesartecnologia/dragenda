'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, FileText, Loader2, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentWaitingCardProps = {
  sessionId: string;
  paymentMethod?: 'credit_card' | 'boleto' | null;
  status?: 'initiated' | 'waiting_payment' | 'paid' | 'expired' | 'cancelled' | null;
  paymentStatus?: string | null;
  invoiceUrl?: string | null;
};

const statusContent = {
  initiated: {
    title: 'Preparando checkout',
    description: 'Estamos aguardando a criação do seu pagamento.',
  },
  waiting_payment: {
    title: 'Aguardando pagamento',
    description: 'Assim que o Asaas confirmar o pagamento, o cadastro da clínica será liberado automaticamente.',
  },
  paid: {
    title: 'Pagamento confirmado',
    description: 'Seu pagamento já foi confirmado. Estamos liberando o onboarding da clínica.',
  },
  expired: {
    title: 'Pagamento vencido',
    description: 'Esse checkout expirou. Gere um novo checkout para continuar.',
  },
  cancelled: {
    title: 'Pagamento cancelado',
    description: 'Esse checkout foi cancelado. Gere um novo checkout para continuar.',
  },
} as const;

export function PaymentWaitingCard({
  sessionId,
  paymentMethod = null,
  status = 'waiting_payment',
  paymentStatus = null,
  invoiceUrl = null,
}: PaymentWaitingCardProps) {
  const router = useRouter();
  const resolvedStatus = status ?? 'waiting_payment';
  const isBoleto = paymentMethod === 'boleto';
  const isFinalError = resolvedStatus === 'expired' || resolvedStatus === 'cancelled';
  const content = statusContent[resolvedStatus];

  useEffect(() => {
    if (isFinalError) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isFinalError, router]);

  return (
    <Card className="w-full border-sky-100 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">{content.title}</CardTitle>
        <CardDescription className="text-[15px] leading-6 text-slate-600">{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-8 text-sm text-slate-600">
        {!isFinalError ? <Loader2 className="h-5 w-5 animate-spin text-sky-600" /> : null}
        <p>Status atual do Asaas: {paymentStatus ?? (resolvedStatus === 'paid' ? 'CONFIRMED' : 'PENDING')}</p>

        {isBoleto && invoiceUrl ? (
          <div className="w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm leading-6 text-slate-600">
                Abra o boleto para concluir o pagamento. Depois disso, volte para esta página para continuar o cadastro da clínica.
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
            <RotateCcw className="mr-2 h-4 w-4" />
            Atualizar status
          </Button>
          <Button asChild className="flex-1" variant={isFinalError ? 'default' : 'secondary'}>
            <Link href="/assinatura">{isFinalError ? 'Gerar novo checkout' : 'Voltar aos planos'}</Link>
          </Button>
        </div>

        <p className="text-xs text-slate-400">Sessão do checkout: {sessionId}</p>
      </CardContent>
    </Card>
  );
}
