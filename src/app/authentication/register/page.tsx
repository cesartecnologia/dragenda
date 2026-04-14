import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/auth';

import { AuthShell } from '../components/auth-shell';
import SignUpForm from '../components/sign-up-form';

const RegisterPage = async () => {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/pos-login');
  }

  return (
    <AuthShell
      headerLinkHref="/autenticacao/login"
      headerLinkLabel="Área do cliente"
      mode="single"
    >
      <SignUpForm />
    </AuthShell>
  );
};

export default RegisterPage;
