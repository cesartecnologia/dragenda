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
      eyebrow="Área do cliente"
      title="Entre na sua clínica"
      description="Acesse sua conta para continuar a rotina da clínica no Dr. Agenda."
      headerLinkHref="/autenticacao"
      headerLinkLabel="Ver plano"
    >
      <LoginForm />
    </AuthShell>
  );
};

export default AuthenticationLoginPage;
