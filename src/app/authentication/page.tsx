import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/auth';

import { AuthShell } from './components/auth-shell';
import LoginForm from './components/login-form';

const AuthenticationPage = async () => {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/pos-login');
  }

  return (
    <AuthShell
      eyebrow="Acesso da clínica"
      title="Entre na Clínica Smart e gerencie sua operação com mais controle."
      description="Tenha acesso à agenda, pacientes, equipe e indicadores da clínica em uma experiência simples, profissional e pronta para o dia a dia."
    >
      <LoginForm />
    </AuthShell>
  );
};

export default AuthenticationPage;
