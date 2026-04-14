import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/auth';

import { AuthShell } from '../components/auth-shell';
import LoginForm from '../components/login-form';

const AuthenticationLoginPage = async () => {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/pos-login');
  }

  return (
    <AuthShell
      title="Acesse sua conta"
      description="Entre para acessar o Dr. Agenda com praticidade e segurança."
      headerLinkHref="/assinatura"
      headerLinkLabel="Ver plano"
    >
      <LoginForm />
    </AuthShell>
  );
};

export default AuthenticationLoginPage;
