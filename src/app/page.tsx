import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession();
  if (session?.user) redirect(session.user.hasSubscriptionAccess ? '/painel' : '/assinatura');
  redirect('/autenticacao');
}
