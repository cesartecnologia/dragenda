'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { syncAsaasSubscription } from '@/actions/sync-asaas-subscription';

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 15;

export function CheckoutSuccessSync() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attempts, setAttempts] = useState(0);

  const scheduleNextSync = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAttempts((current) => current + 1);
      syncAction.execute();
    }, POLL_INTERVAL_MS);
  };

  const syncAction = useAction(syncAsaasSubscription, {
    onSuccess: ({ data }) => {
      if (data?.accessReleased) {
        toast.success('Pagamento confirmado. Acesso liberado.');
        router.replace('/painel?checkout=success');
        router.refresh();
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        toast.info('Ainda aguardando a confirmação do Asaas. Clique em Sincronizar com Asaas se necessário.');
        return;
      }

      scheduleNextSync();
    },
    onError: ({ error }) => {
      if (attempts >= MAX_ATTEMPTS) return;
      if (attempts === 0) {
        toast.error(error.serverError ?? 'Não foi possível confirmar a assinatura automaticamente.');
      }
      scheduleNextSync();
    },
  });

  const statusText = useMemo(() => {
    if (attempts === 0 && syncAction.isExecuting) return 'Confirmando o pagamento no Asaas...';
    if (attempts > 0) return `Verificando a confirmação do Asaas (${Math.min(attempts + 1, MAX_ATTEMPTS)}/${MAX_ATTEMPTS})...`;
    return 'Preparando confirmação automática do pagamento...';
  }, [attempts, syncAction.isExecuting]);

  useEffect(() => {
    syncAction.execute();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
      <Loader2 className="size-4 animate-spin" />
      <span>{statusText}</span>
    </div>
  );
}
