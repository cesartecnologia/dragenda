'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncAsaasSubscription } from '@/actions/sync-asaas-subscription';

export function CheckoutSuccessSync() {
  const router = useRouter();
  const syncAction = useAction(syncAsaasSubscription);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const run = () => {
      if (cancelled || attempts >= 4) return;
      attempts += 1;
      syncAction.execute();
      if (!cancelled && attempts < 4) {
        window.setTimeout(run, 2500);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (syncAction.result.data?.accessReleased) {
      toast.success('Pagamento confirmado. Acesso liberado.');
      router.push('/painel');
      router.refresh();
    }
  }, [syncAction.result.data?.accessReleased, router]);

  return null;
}
