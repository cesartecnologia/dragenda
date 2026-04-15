'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CreditCard, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PublicCardCheckoutStartProps = {
  paymentMethod?: 'credit_card' | 'boleto';
};

const copyByMethod = {
  credit_card: {
    badge: 'Cartão de crédito',
    title: 'Abrindo sua página de pagamento',
    description: 'Você será direcionado para a página de pagamento em instantes.',
    retryLabel: 'Tentar novamente',
    endpoint: '/api/asaas/public-card-checkout',
    Icon: CreditCard,
  },
  boleto: {
    badge: 'Boleto bancário',
    title: 'Abrindo sua página de pagamento',
    description: 'Você será direcionado para a página de pagamento em instantes.',
    retryLabel: 'Tentar novamente',
    endpoint: '/api/asaas/public-boleto-subscription',
    Icon: FileText,
  },
} as const;

export function PublicCardCheckoutStart({ paymentMethod = 'credit_card' }: PublicCardCheckoutStartProps) {
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const content = copyByMethod[paymentMethod];
  const Icon = content.Icon;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startCheckout = async () => {
      try {
        const response = await fetch(content.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const payload = (await response.json().catch(() => null)) as { error?: string; checkoutUrl?: string } | null;

        if (!response.ok || !payload?.checkoutUrl) {
          throw new Error(payload?.error || 'Não foi possível abrir a página de pagamento agora.');
        }

        window.location.href = payload.checkoutUrl;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Não foi possível abrir a página de pagamento agora.';
        setError(message);
        toast.error(message);
      }
    };

    void startCheckout();
  }, [content.endpoint]);

  return (
    <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          <Icon className="h-3.5 w-3.5" />
          {content.badge}
        </div>
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">{content.title}</CardTitle>
        <CardDescription className="text-[15px] leading-6 text-slate-600">{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="space-y-4 text-center">
            <p className="text-sm leading-6 text-slate-600">{error}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="outline" className="rounded-xl border-slate-300">
                <Link href="/assinatura">Voltar para assinatura</Link>
              </Button>
              <Button onClick={() => window.location.reload()} className="rounded-xl bg-slate-950 hover:bg-slate-800">
                {content.retryLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparando pagamento...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
