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
      title="Configure sua clínica e ative o plano ideal em poucos minutos."
      description="No primeiro acesso você cadastra os dados da clínica, prepara a assinatura e deixa tudo pronto para começar a operar sem retrabalho."
    >
      <SignUpForm />
    </AuthShell>
  );
};

export default RegisterPage;
