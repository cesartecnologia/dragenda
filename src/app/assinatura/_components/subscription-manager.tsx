'use client';

import { Loader2, RefreshCcw, ShieldX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { cancelAsaasSubscription } from '@/actions/cancel-asaas-subscription';
import { syncAsaasSubscription } from '@/actions/sync-asaas-subscription';
import { Button } from '@/components/ui/button';

export function SubscriptionManager({
  canCancel,
  bypassSubscription,
}: {
  canCancel: boolean;
  bypassSubscription?: boolean;
}) {
  const router = useRouter();

  const syncAction = useAction(syncAsaasSubscription, {
    onSuccess: ({ data }) => {
      toast.success(
        data?.accessReleased
          ? 'Assinatura sincronizada e acesso liberado.'
          : 'Status sincronizado com o Asaas.',
      );
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível sincronizar a assinatura.');
    },
  });

  const cancelAction = useAction(cancelAsaasSubscription, {
    onSuccess: () => {
      toast.success('Assinatura cancelada no Asaas.');
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível cancelar a assinatura.');
    },
  });

  const handleCancel = () => {
    if (!canCancel || bypassSubscription) return;
    const confirmed = window.confirm('Deseja realmente cancelar a assinatura da clínica no Asaas?');
    if (!confirmed) return;
    cancelAction.execute();
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button type="button" variant="outline" onClick={() => syncAction.execute()} disabled={syncAction.isExecuting}>
        {syncAction.isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCcw className="mr-2 size-4" />}
        Sincronizar com Asaas
      </Button>

      <Button
        type="button"
        variant="destructive"
        onClick={handleCancel}
        disabled={!canCancel || bypassSubscription || cancelAction.isExecuting}
      >
        {cancelAction.isExecuting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldX className="mr-2 size-4" />}
        Cancelar assinatura
      </Button>
    </div>
  );
}
