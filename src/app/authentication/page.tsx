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
      title="Entre no Dr. Agenda e gerencie sua operação com mais agilidade."
      description="Tenha acesso à agenda, pacientes, equipe e informações importantes da clínica em uma experiência rápida, profissional e pronta para o dia a dia."
    >
      <LoginForm />
    </AuthShell>
  );
};

export default AuthenticationPage;
