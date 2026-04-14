import Link from 'next/link';
import { ArrowLeft, CreditCard, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PublicCardCheckoutStartProps = {
  error?: string | null;
};

export function PublicCardCheckoutStart({ error }: PublicCardCheckoutStartProps) {
  return (
    <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <CreditCard className="h-3.5 w-3.5" />
          Assinatura por cartao
        </div>
        <CardTitle className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">Nao foi possivel continuar agora</CardTitle>
        <CardDescription className="text-[15px] leading-6 text-slate-600">
          {error || 'Tivemos uma instabilidade momentanea ao abrir o pagamento. Tente novamente em instantes.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="rounded-xl border-slate-300">
            <Link href="/assinatura">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
            <Link href="/assinatura/cartao">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
