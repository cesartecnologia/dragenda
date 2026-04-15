import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthShell } from '@/app/authentication/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSession } from '@/lib/auth';
import { getCheckoutSessionById, getOnboardingBySessionId, syncCheckoutSessionWithAsaas } from '@/server/checkout-sessions';
import { getPendingSignupById, syncPendingSignupWithAsaas } from '@/server/pending-signups';

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
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const legacyIntentId = Array.isArray(params.intentId) ? params.intentId[0] : params.intentId;

  if (sessionId) {
    let checkoutSession = await getCheckoutSessionById(sessionId);

    if (!checkoutSession) {
      return (
        <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
          <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
            <CardHeader>
              <CardTitle>Contratação não encontrada</CardTitle>
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

    if (checkoutSession.status !== 'paid') {
      try {
        const synced = await syncCheckoutSessionWithAsaas(checkoutSession.id);
        if (synced) checkoutSession = synced;
      } catch (error) {
        console.error('CHECKOUT_SESSION_SYNC_FAILED', error);
      }
    }

    const onboarding = await getOnboardingBySessionId(checkoutSession.id);

    if (onboarding?.status === 'completed') {
      return (
        <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
          <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
            <CardHeader>
              <CardTitle>Acesso já criado</CardTitle>
              <CardDescription>Seu cadastro foi concluído. Entre com seu e-mail e senha para acessar a clínica.</CardDescription>
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

    if (checkoutSession.status !== 'paid' || !onboarding || (onboarding.status !== 'released' && onboarding.status !== 'processing')) {
      return (
        <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
          <PaymentWaitingCard
            status={checkoutSession.status}
            paymentMethod={checkoutSession.paymentMethod}
            invoiceUrl={checkoutSession.invoiceUrl}
          />
        </AuthShell>
      );
    }

    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <CompletePaidSignupForm
          sessionId={checkoutSession.id}
          defaults={{
            name: checkoutSession.customerName,
            email: checkoutSession.customerEmail,
            phone: checkoutSession.customerPhone,
            clinicName: checkoutSession.companyName,
            clinicCnpj: checkoutSession.customerCpfCnpj,
            address: checkoutSession.customerAddress,
            addressNumber: checkoutSession.customerAddressNumber,
            complement: checkoutSession.customerAddressComplement,
            postalCode: checkoutSession.customerPostalCode,
            province: checkoutSession.customerProvince,
          }}
        />
      </AuthShell>
    );
  }

  if (!legacyIntentId) {
    redirect('/assinatura');
  }

  let intent = await getPendingSignupById(legacyIntentId);

  if (!intent) {
    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
          <CardHeader>
            <CardTitle>Contratação não encontrada</CardTitle>
            <CardDescription>Esse link não está mais disponível. Gere uma nova assinatura para continuar.</CardDescription>
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

  if (intent.status !== 'registration_completed') {
    try {
      const synced = await syncPendingSignupWithAsaas(intent.id);
      if (synced) intent = synced;
    } catch (error) {
      console.error('PENDING_SIGNUP_SYNC_FAILED', error);
    }
  }

  if (intent.status === 'registration_completed') {
    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <Card className="w-full border-slate-200 bg-white shadow-[0_20px_70px_rgba(14,165,233,0.10)]">
          <CardHeader>
            <CardTitle>Acesso já criado</CardTitle>
            <CardDescription>Seu cadastro foi concluído. Entre com seu e-mail e senha para acessar a clínica.</CardDescription>
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

  if (intent.status !== 'checkout_paid') {
    return (
      <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
        <PaymentWaitingCard paymentMethod={intent.paymentMethod} invoiceUrl={intent.invoiceUrl} status="waiting_payment" />
      </AuthShell>
    );
  }

  return (
    <AuthShell headerLinkHref="/login" headerLinkLabel="Área do cliente" mode="single">
      <CompletePaidSignupForm
        sessionId={intent.id}
        defaults={{
          name: intent.payerName,
          email: intent.payerEmail,
          phone: intent.payerPhone,
          clinicName: intent.clinicName,
          clinicCnpj: intent.clinicCnpj,
          address: intent.address,
          addressNumber: intent.addressNumber,
          complement: intent.complement,
          postalCode: intent.postalCode,
          province: intent.province,
        }}
      />
    </AuthShell>
  );
}
