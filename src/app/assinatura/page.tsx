import { redirect } from 'next/navigation';

import { requireSession } from '@/lib/auth';
import { SubscriptionPlan } from '@/app/(protected)/subscription/_components/subscription-plan';

export default async function AssinaturaPage() {
  const session = await requireSession();
  if (session.user.hasSubscriptionAccess && session.user.clinic) redirect('/painel');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 px-6 py-16">
      <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Assine seu plano</h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Finalize sua assinatura para liberar o acesso completo da clínica.
        </p>
      </div>
      <div className="relative mt-10 w-full max-w-[380px]">
        <SubscriptionPlan
          active={Boolean(session.user.plan)}
          bypassSubscription={session.user.bypassSubscription}
          userEmail={session.user.email}
        />
      </div>
    </div>
  );
}
