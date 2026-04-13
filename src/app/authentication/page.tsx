import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/auth';

import { PublicSubscriptionView } from '../assinatura/_components/public-subscription-view';

const AuthenticationPage = async () => {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/pos-login');
  }

  return <PublicSubscriptionView source="login" />;
};

export default AuthenticationPage;
