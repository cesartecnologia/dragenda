import { redirect } from 'next/navigation';

import { AuthShell } from '@/app/authentication/components/auth-shell';
import { requireSession } from '@/lib/auth';

import { FirstLoginPasswordForm } from './_components/first-login-password-form';

export default async function PrimeiroLoginPage() {
  const session = await requireSession();

  if (!session.user.mustChangePassword) {
    redirect('/pos-login');
  }

  return (
    <AuthShell
      eyebrow="Segurança da conta"
      title="Atualize sua senha para concluir o primeiro acesso."
      description="Use a senha temporária recebida pela clínica e defina sua senha definitiva para entrar no Dr. Agenda com segurança."
    >
      <FirstLoginPasswordForm email={session.user.email} />
    </AuthShell>
  );
}
