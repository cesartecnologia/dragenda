import { redirect } from 'next/navigation';

import { getServerSession, hasSubscriptionAccess } from '@/lib/auth';

export default async function PosLoginPage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/autenticacao');
  if (!session.user.clinic) redirect('/configuracoes/clinica');
  if (!hasSubscriptionAccess(session)) redirect('/assinatura');
  redirect('/painel');
}
