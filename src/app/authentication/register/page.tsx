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
      title="Cadastre sua clínica para seguir com a contratação."
      description="Preencha os dados do responsável e da clínica. Ao concluir, você será direcionado automaticamente para a assinatura do plano."
    >
      <SignUpForm />
    </AuthShell>
  );
};

export default RegisterPage;
