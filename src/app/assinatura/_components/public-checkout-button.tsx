'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

const endpointByMethod = {
  credit_card: '/api/asaas/public-card-checkout',
  boleto: '/api/asaas/public-boleto-subscription',
} as const;

type PublicCheckoutButtonProps = {
  paymentMethod: keyof typeof endpointByMethod;
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
};

type CheckoutPayload = {
  error?: string;
  checkoutUrl?: string;
  sessionId?: string;
};

export function PublicCheckoutButton({
  paymentMethod,
  label,
  variant = 'default',
  className,
}: PublicCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(endpointByMethod[paymentMethod], {
        method: 'POST',
      });

      const payload = (await response.json().catch(() => null)) as CheckoutPayload | null;

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error || 'Não foi possível abrir a página de pagamento agora.');
      }

      if (paymentMethod === 'boleto' && payload.sessionId) {
        const opened = window.open(payload.checkoutUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          window.location.assign(payload.checkoutUrl);
          return;
        }

        window.location.assign(`/primeiro-acesso?sessionId=${encodeURIComponent(payload.sessionId)}`);
        return;
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível abrir a página de pagamento agora.';
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <Button type="button" size="lg" variant={variant} className={className} onClick={handleClick} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      <span className="truncate">{label}</span>
      {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
    </Button>
  );
}
