import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/app/authentication/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startPublicCheckout } from '@/server/public-checkout';

export const dynamic = 'force-dynamic';

export default async function AssinaturaBoletoPage() {
  try {
    const checkout = await startPublicCheckout('boleto');
    redirect(checkout.checkoutUrl);
  } catch (error) {
    console.error('PUBLIC_BOLETO_PAGE_FAILED', error);

    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <Card className="w-full border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-slate-900">Não foi possível abrir o boleto</CardTitle>
            <CardDescription className="text-[15px] leading-6 text-slate-600">
              Tente novamente em instantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1 rounded-xl border-slate-300">
              <Link href="/assinatura">Voltar</Link>
            </Button>
            <Button asChild className="flex-1 rounded-xl bg-slate-950 hover:bg-slate-800">
              <Link href="/assinatura/boleto">Tentar novamente</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }
}
