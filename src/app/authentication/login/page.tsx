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
      title="Entre na sua clínica e continue de onde parou."
      description="Acesse sua conta com e-mail e senha para gerenciar a rotina da clínica no Dr. Agenda."
    >
      <LoginForm />
    </AuthShell>
  );
};

export default AuthenticationLoginPage;
