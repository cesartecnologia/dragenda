import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/app/authentication/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSession } from '@/lib/auth';
import { getCheckoutSessionById, getOnboardingBySessionId, syncCheckoutSessionWithAsaas } from '@/server/checkout-sessions';

import { CompletePaidSignupForm } from './_components/complete-paid-signup-form';
import { PaymentWaitingCard } from './_components/payment-waiting-card';

export default async function PrimeiroAcessoPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/pos-login');
  }

  const params = (await searchParams) ?? {};
  const sessionIdParam = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const legacyIntentId = Array.isArray(params.intentId) ? params.intentId[0] : params.intentId;
  const sessionId = sessionIdParam ?? legacyIntentId;

  if (!sessionId) {
    redirect('/assinatura');
  }

  let checkoutSession = await getCheckoutSessionById(sessionId);
  let onboarding = await getOnboardingBySessionId(sessionId);

  if (!checkoutSession || !onboarding) {
    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
          <CardHeader>
            <CardTitle>Pagamento não encontrado</CardTitle>
            <CardDescription>Esse link não está mais disponível. Gere um novo pagamento para continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/assinatura">Voltar para assinatura</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  if (checkoutSession.status !== 'paid' || onboarding.status !== 'completed') {
    try {
      const synced = await syncCheckoutSessionWithAsaas(checkoutSession.id);
      if (synced) {
        checkoutSession = synced;
        onboarding = (await getOnboardingBySessionId(checkoutSession.id)) ?? onboarding;
      }
    } catch (error) {
      console.error('CHECKOUT_SESSION_SYNC_FAILED', error);
    }
  }

  if (onboarding.status === 'completed') {
    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
          <CardHeader>
            <CardTitle>Cadastro concluído</CardTitle>
            <CardDescription>Seu cadastro foi concluído. Entre com seu e-mail e senha para acessar o sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Ir para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  if (checkoutSession.status !== 'paid' || onboarding.status !== 'released') {
    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <PaymentWaitingCard
          sessionId={checkoutSession.id}
          paymentMethod={checkoutSession.paymentMethod}
          status={checkoutSession.status}
          paymentStatus={checkoutSession.paymentStatus}
          invoiceUrl={checkoutSession.invoiceUrl}
          checkoutUrl={checkoutSession.checkoutUrl}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <CompletePaidSignupForm
        sessionId={checkoutSession.id}
        defaults={{
          name: checkoutSession.payerName,
          email: checkoutSession.payerEmail,
          phone: checkoutSession.payerPhone,
        }}
      />
    </AuthShell>
  );
}
