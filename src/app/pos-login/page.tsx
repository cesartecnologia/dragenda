import { redirect } from 'next/navigation';

import { getServerSession, hasPrivilegedAccess, hasSubscriptionAccess } from '@/lib/auth';

export default async function PosLoginPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/autenticacao');
  }

  if (!session.user.clinic && !hasPrivilegedAccess(session)) {
    redirect('/configuracoes/clinica?onboarding=1');
  }

  if (!hasSubscriptionAccess(session)) {
    redirect('/assinatura');
  }

  redirect('/painel');
}
