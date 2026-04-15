'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FileText, Loader2, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentWaitingCardProps = {
  sessionId: string;
  paymentMethod?: 'credit_card' | 'boleto' | null;
  status?: 'initiated' | 'waiting_payment' | 'paid' | 'expired' | 'cancelled' | null;
  paymentStatus?: string | null;
  invoiceUrl?: string | null;
  checkoutUrl?: string | null;
};

const statusContent = {
  initiated: {
    title: 'Preparando pagamento',
    description: 'Em instantes você será atualizado por aqui.',
  },
  waiting_payment: {
    title: 'Aguardando pagamento',
    description: 'Assim que o pagamento for confirmado, seu cadastro será liberado.',
  },
  paid: {
    title: 'Pagamento confirmado',
    description: 'Tudo certo. Você já pode finalizar seu cadastro.',
  },
  expired: {
    title: 'Pagamento vencido',
    description: 'Gere um novo pagamento para continuar.',
  },
  cancelled: {
    title: 'Pagamento cancelado',
    description: 'Se quiser continuar, gere um novo pagamento.',
  },
} as const;

export function PaymentWaitingCard({
  sessionId,
  paymentMethod = null,
  status = 'waiting_payment',
  paymentStatus = null,
  invoiceUrl = null,
  checkoutUrl = null,
}: PaymentWaitingCardProps) {
  const router = useRouter();
  const resolvedStatus = status ?? 'waiting_payment';
  const isBoleto = paymentMethod === 'boleto';
  const isFinalError = resolvedStatus === 'expired' || resolvedStatus === 'cancelled';
  const content = statusContent[resolvedStatus];
  const boletoLink = invoiceUrl ?? checkoutUrl;
  const simpleStatus = paymentStatus === 'CONFIRMED' || resolvedStatus === 'paid'
    ? 'Confirmado'
    : resolvedStatus === 'expired'
      ? 'Vencido'
      : resolvedStatus === 'cancelled'
        ? 'Cancelado'
        : 'Aguardando confirmação';

  useEffect(() => {
    if (isFinalError) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isFinalError, router, sessionId]);

  return (
    <Card className="w-full border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <CardHeader className="space-y-2 pb-4 text-center">
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">{content.title}</CardTitle>
        <CardDescription className="text-[15px] leading-6 text-slate-600">{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pb-8 text-sm text-slate-600">
        {!isFinalError ? <Loader2 className="h-5 w-5 animate-spin text-slate-700" /> : null}
        <p>Situação: {simpleStatus}</p>

        {isBoleto && boletoLink ? (
          <div className="w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm leading-6 text-slate-600">
                Se você ainda não pagou, abra o boleto para concluir o pagamento.
              </p>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link href={boletoLink} target="_blank" rel="noreferrer">
                Abrir boleto
              </Link>
            </Button>
          </div>
        ) : null}

        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1 border-slate-300" onClick={() => router.refresh()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button asChild className="flex-1 bg-slate-950 hover:bg-slate-800" variant={isFinalError ? 'default' : 'secondary'}>
            <Link href="/assinatura">{isFinalError ? 'Gerar novo pagamento' : 'Voltar'}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
