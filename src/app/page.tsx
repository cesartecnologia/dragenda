import { redirect } from 'next/navigation';

import { getAuthenticatedRedirectPath, getServerSession } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession();
  if (session?.user) redirect(getAuthenticatedRedirectPath(session));
  redirect('/autenticacao');
}
