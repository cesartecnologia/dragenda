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
      eyebrow="Primeiro acesso"
      title="Cadastre sua clínica"
      description="Informe os dados do responsável e da clínica para continuar."
      headerLinkHref="/autenticacao/login"
      headerLinkLabel="Área do cliente"
    >
      <SignUpForm />
    </AuthShell>
  );
};

export default RegisterPage;
