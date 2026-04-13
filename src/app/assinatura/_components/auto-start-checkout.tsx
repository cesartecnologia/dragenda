'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { createAsaasCheckout } from '@/actions/create-asaas-checkout';

export function AutoStartCheckout() {
  const startedRef = useRef(false);

  const checkoutAction = useAction(createAsaasCheckout, {
    onSuccess: ({ data }) => {
      if (!data?.checkoutUrl) {
        toast.error('Não foi possível abrir a contratação agora.');
        return;
      }

      window.location.href = data.checkoutUrl;
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível iniciar a assinatura.');
    },
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    checkoutAction.execute();
  }, [checkoutAction]);

  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">
      <Loader2 className="h-4 w-4 animate-spin" />
      Preparando sua assinatura...
    </div>
  );
}
