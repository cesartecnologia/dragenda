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
      title="Comece com a estrutura certa para operar sua clínica com confiança."
      description="Cadastre os dados da clínica, prepare sua assinatura e deixe o Dr. Agenda pronto para uso desde o primeiro acesso."
    >
      <SignUpForm />
    </AuthShell>
  );
};

export default RegisterPage;
