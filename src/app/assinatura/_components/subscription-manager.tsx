'use client';

import { Loader2, ShieldX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { cancelAsaasSubscription } from '@/actions/cancel-asaas-subscription';
import { Button } from '@/components/ui/button';

export function SubscriptionManager({
  canCancel,
  bypassSubscription,
}: {
  canCancel: boolean;
  bypassSubscription?: boolean;
}) {
  const router = useRouter();

  const cancelAction = useAction(cancelAsaasSubscription, {
    onSuccess: () => {
      toast.success('Assinatura cancelada com sucesso.');
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível cancelar a assinatura.');
    },
  });

  const handleCancel = () => {
    if (!canCancel || bypassSubscription) return;
    const confirmed = window.confirm('Deseja realmente cancelar a assinatura da clínica?');
    if (!confirmed) return;
    cancelAction.execute();
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
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
