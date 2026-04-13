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
      title="Sua clínica mais organizada, profissional e pronta para o dia a dia."
      description="Entre no Dr. Agenda para acompanhar pacientes, equipe, horários e a rotina da clínica em um só lugar."
    >
      <LoginForm />
    </AuthShell>
  );
};

export default AuthenticationPage;
