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
    badge: 'Checkout Asaas - cartão',
    title: 'Abrindo checkout padrão do Asaas',
    description: 'Você paga primeiro no checkout seguro do Asaas. O cadastro da clínica só será liberado após a confirmação do pagamento.',
    retryLabel: 'Tentar abrir checkout novamente',
    endpoint: '/api/asaas/public-card-checkout',
    Icon: CreditCard,
  },
  boleto: {
    badge: 'Checkout Asaas - boleto',
    title: 'Abrindo checkout padrão do Asaas',
    description: 'Você gera e paga o boleto primeiro no checkout seguro do Asaas. O cadastro da clínica só será liberado após a confirmação do pagamento.',
    retryLabel: 'Tentar abrir checkout novamente',
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
          throw new Error(payload?.error || 'Não foi possível abrir o checkout agora.');
        }

        window.location.href = payload.checkoutUrl;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Não foi possível abrir o checkout agora.';
        setError(message);
        toast.error(message);
      }
    };

    void startCheckout();
  }, [content.endpoint]);

  return (
    <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
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
              <Button onClick={() => window.location.reload()} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                {content.retryLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparando seu checkout...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
